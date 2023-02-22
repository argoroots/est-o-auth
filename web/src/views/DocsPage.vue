<template>
  <section>
    <h1>
      <a href="/">OAuth.ee <span>by Argo Roots</span></a>
    </h1>

    <ol>
      <li>
        Read our <a href="/terms">Terms & Conditions</a>.
      </li>
      <li>
        <a href="mailto:argo@roots.ee?subject=How to start with OAuth.ee?">Make request</a> to get <em>client_id</em> and <em>client_secret</em>. You need those on later steps.
      </li>
      <li>
        <p>Redirect user to one of the following url:</p>
        <ul>
          <li><a href="/auth/id-card">/auth/id-card</a></li>
          <li><a href="/auth/mobile-id">/auth/mobile-id</a></li>
          <li><a href="/auth/smart-id">/auth/smart-id</a></li>
          <li><a href="/auth/e-mail">/auth/e-mail</a></li>
          <li><a href="/auth/phone">/auth/phone</a></li>
          <li><a href="/auth">/auth</a> - <em>will ask user the preferred auth method</em></li>
        </ul>
        <p>Required query parameters:</p>
        <ul>
          <li>response_type - <em>always equals to "code"</em></li>
          <li>client_id</li>
          <li>redirect_uri</li>
          <li>scope - <em>always equals to "openid"</em></li>
          <li>state</li>
        </ul>
        <p>Optional parameters - if not set, user must input required ones (depends of auth method):</p>
        <ul>
          <li>idcode - <em>only for <a href="/auth/mobile-id">/auth/mobile-id</a> and <a href="/auth/smart-id">/auth/smart-id</a></em></li>
          <li>phone - <em>only for <a href="/auth/mobile-id">/auth/mobile-id</a> and <a href="/auth/phone">/auth/phone</a></em></li>
          <li>email - <em>only for <a href="/auth/e-mail">/auth/e-mail</a></em></li>
        </ul>
        <pre>https://oauth.ee/auth?response_type=code&client_id=QVnPZGdcXQ8Ev4mx&redirect_uri=https://example.com/auth/callback&scope=openid&state=5600684163565994</pre>
        <p>
          After authentication user is redirected back to url set in <em>redirect_uri</em> parameter. Query
          parameter <em>code</em> contains the authorization code which Your service will exchange for an access
          token.
        </p>
        <p>
          If the initial request contained a <em>state</em> parameter, the response also includes the exact value
          from the request. Your service must check if it matches one from initial request.
        </p>
        <pre>https://example.com/auth/callback?code=CYD9MDm8gY2F8EhV&state=5600684163565994</pre>
      </li>
      <li>
        <p>
          Make POST request to <a href="/token">/token</a> sending <em>client_id</em>, <em>client_secret</em>,
          <em>grant_type</em> and <em>code</em> (got from previous step). Parameter grant_type must always be
          "authorization_code".
        </p>
        <pre>POST /token HTTP/1.1
Host: oauth.ee
Content-Type: application/json; charset=utf-8
Content-Length: 165

{
  "client_id": "QVnPZGdcXQ8Ev4mx",
  "client_secret": "aLs6BLQfhd3dX8rUDnvQzmhZcVMNPnwy",
  "code": "CYD9MDm8gY2F8EhV",
  "grant_type": "authorization_code"
}</pre>
        <p>Response contains <em>access_token</em> what You need to get user information.</p>
        <pre>{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
  "expires_in": 3600,
  "token_type": "Bearer",
  "state": "5600684163565994"
}</pre>
      </li>
      <li>
        <p>
          To get user information make GET request to <a href="/user">/user</a> with <em>access_token</em> (got from
          previous step) as query parameter or as Bearer authorization header (preferred!).
        </p>
        <pre>GET /user HTTP/1.1
Host: oauth.ee
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9</pre>
        <p>Response contains user information as JSON object.</p>
        <pre>{
  "id": "38001085718",
  "email": "38001085718@eesti.ee",
  "name": "JAAK-KRISTJAN JÕEORG"
}</pre>
      </li>
    </ol>
  </section>
</template>

<style scoped>
section {
  @apply max-w-3xl;
  @apply mx-auto;
  @apply mb-16;
  @apply px-8;
  @apply lg:px-0;
}

ol {
  @apply list-decimal;
}

ol > li {
  @apply mb-8;
}

li a {
  @apply text-red-900;
}

ul {
  @apply list-disc;
  @apply ml-5;
  @apply mb-4;
}

pre {
  @apply mb-4;
  @apply p-2;
  @apply rounded;
  @apply text-xs;
  @apply text-white;
  @apply bg-stone-900;
  @apply overflow-auto;
}
</style>
