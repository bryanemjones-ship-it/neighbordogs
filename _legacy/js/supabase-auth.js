(function () {
  if (typeof window.supabase === "undefined") return;
  var url = window.SUPABASE_URL;
  var key = window.SUPABASE_ANON_KEY;
  if (!url || !key) return;
  var client = window.supabase.createClient(url, key);
  window.supabaseClient = client;
  window.supabaseSession = null;

  function updateSession(session) {
    window.supabaseSession = session;
  }

  window.supabaseAuthInit = function () {
    client.auth.getSession().then(function (r) {
      updateSession(r.data.session);
    });
    client.auth.onAuthStateChange(function (event, session) {
      updateSession(session);
    });
  };

  window.supabaseMagicLink = function (email) {
    return client.auth.signInWithOtp({ email: email });
  };

  window.supabaseLogout = function () {
    return client.auth.signOut();
  };
})();
