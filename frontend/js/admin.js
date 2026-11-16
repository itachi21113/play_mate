/* Admin approval and tournament management. */
(function () {
  var h = PMC.h, useState = React.useState, useEffect = React.useEffect;

  function Admin() {
    PMC.useStore();
    var u = useState([]), users = u[0], setUsers = u[1];
    var f = useState("pending"), filter = f[0], setFilter = f[1];
    var n = useState(null), notice = n[0], setNotice = n[1];
    var loadingState = useState(false), loading = loadingState[0], setLoading = loadingState[1];
    var currentUser = PM.currentUser();

    function loadUsers() {
      try {
        setLoading(true);
        setUsers(PM.request("GET", "/api/admin/users"));
        setNotice(null);
      } catch (error) {
        setNotice({ text: error.message, kind: "err" });
      } finally {
        setLoading(false);
      }
    }

    useEffect(function () {
      if (currentUser && currentUser.role === "admin") loadUsers();
    }, []);

    function updateApproval(user, status) {
      try {
        var result = PM.request(
          "PATCH",
          "/api/admin/users/" + encodeURIComponent(user.username) + "/approval",
          { status: status }
        );
        setUsers(users.map(function (item) {
          return item.username === user.username ? result.user : item;
        }));
        setNotice({ text: user.username + " has been " + status + ".", kind: "ok" });
        PM.refreshBootstrap();
      } catch (error) {
        setNotice({ text: error.message, kind: "err" });
      }
    }

    function removeTournament(tournament) {
      if (!window.confirm("Delete \"" + tournament.name + "\" and its registrations?")) return;
      try {
        PM.request(
          "DELETE",
          "/api/admin/tournaments/" + encodeURIComponent(tournament.id)
        );
        PM.refreshBootstrap();
        setNotice({ text: tournament.name + " was deleted.", kind: "ok" });
      } catch (error) {
        setNotice({ text: error.message, kind: "err" });
      }
    }

    if (!currentUser || currentUser.role !== "admin") {
      return h`<header className="page-head studio-head"><h1>Admin Panel</h1>
        <p>Administrator access is required.</p><a className="btn btn-primary" href="login.html">Log in as Admin</a></header>`;
    }

    var counts = {
      all: users.length,
      pending: users.filter(function (user) { return user.approvalStatus === "pending"; }).length,
      approved: users.filter(function (user) { return user.approvalStatus === "approved"; }).length,
      rejected: users.filter(function (user) { return user.approvalStatus === "rejected"; }).length
    };
    var displayedUsers = users.filter(function (user) {
      return filter === "all" || user.approvalStatus === filter;
    });
    var tournaments = PM.tournaments();

    return h`<${React.Fragment}>
      <header className="page-head studio-head"><h1>Admin Panel</h1>
        <p>Review registrations and manage Play-Mate tournaments.</p></header>
      <section className="admin-stats" aria-label="Platform statistics">
        <div className="admin-stat"><strong>${counts.all}</strong><span>Users</span></div>
        <div className="admin-stat"><strong>${counts.pending}</strong><span>Pending approval</span></div>
        <div className="admin-stat"><strong>${counts.approved}</strong><span>Approved users</span></div>
        <div className="admin-stat"><strong>${tournaments.length}</strong><span>Tournaments</span></div>
      </section>
      ${notice ? h`<p className=${"studio-alert " + notice.kind} role="status">${notice.text}</p>` : null}
      <section className="studio-section glass">
        <h2>User Approvals</h2>
        <div className="admin-tabs" role="group" aria-label="Filter users by approval">
          ${[["pending", "Pending"], ["approved", "Approved"], ["rejected", "Rejected"], ["all", "All"]].map(function (item) {
            var count = item[0] === "all" ? counts.all : counts[item[0]];
            return h`<button type="button" className=${filter === item[0] ? "active" : ""}
              aria-pressed=${filter === item[0]} onClick=${function () { setFilter(item[0]); }}>
              ${item[1]} (${count})</button>`;
          })}
        </div>
        ${loading ? h`<p className="muted">Loading users...</p>` : displayedUsers.length
          ? h`<div className="studio-table-wrap"><table className="studio-table">
            <thead><tr><th>User</th><th>Role</th><th>Organization</th><th>Approval</th><th>Actions</th></tr></thead>
            <tbody>${displayedUsers.map(function (user) {
              return h`<tr key=${user.username}>
                <td><strong>${user.fullName}</strong><small>@${user.username} · ${user.email}</small></td>
                <td>${user.role}</td><td>${user.organizationName || "\u2014"}</td>
                <td><span className=${"approval-pill " + user.approvalStatus}>${user.approvalStatus}</span></td>
                <td>${user.approvalStatus === "pending" ? h`<div className="studio-actions">
                  <button className="btn btn-primary" type="button" onClick=${function () { updateApproval(user, "approved"); }}>Approve</button>
                  <button className="btn btn-danger" type="button" onClick=${function () { updateApproval(user, "rejected"); }}>Reject</button>
                </div>` : null}</td>
              </tr>`;
            })}</tbody></table></div>`
          : h`<${PMC.Empty} title="No users here" text="No accounts match this approval filter." />`}
      </section>
      <section className="studio-section glass">
        <h2>Tournament Management</h2>
        ${tournaments.length ? h`<div className="studio-table-wrap"><table className="studio-table">
          <thead><tr><th>Tournament</th><th>Host</th><th>Status</th><th>Registered</th><th>Action</th></tr></thead>
          <tbody>${tournaments.map(function (tournament) {
            return h`<tr key=${tournament.id}>
              <td><strong>${tournament.name}</strong><small>${tournament.game}</small></td>
              <td>${tournament.host}</td>
              <td><span className=${"approval-pill " + tournament.status}>${tournament.status}</span></td>
              <td>${tournament.taken} / ${tournament.max}</td>
              <td><button className="btn btn-danger" type="button" onClick=${function () { removeTournament(tournament); }}>Delete</button></td>
            </tr>`;
          })}</tbody></table></div>`
        : h`<${PMC.Empty} title="No tournaments" text="There are no tournaments to manage." />`}
      </section>
    </${React.Fragment}>`;
  }

  PMC.mount(Admin);
})();
