# OAuth.ee

Use Estonian ID-card, Mobile-ID, Smart-ID or E-mail as OAuth authentication provider.

## Usage
1. Redirect user to one of the following url:
    - [/auth/id-card]()
    - [/auth/mobile-id]()
    - [/auth/smart-id]()
    - [/auth/e-mail]()
    - [/auth/phone]()
    - [/auth]() - *will ask user the preferred auth method*

    Required query parameters:
    - response_type - *always equals to "code"*
    - client_id
    - redirect_uri
    - scope - *always equals to "openid"*
    - state

    Optional parameters - if not set, user must input required ones (depends of auth method):
    - idcode - *only for [/auth/mobile-id]() and [/auth/smart-id]()*
    - phone - *only for [/auth/mobile-id]() and [/auth/phone]()*
    - email - *only for [/auth/e-mail]()*

    ```bash
    https://oauth.ee/auth?response_type=code&client_id=QVnPZGdcXQ8Ev4mx&redirect_uri=https://example.com/auth/callback&scope=openid&state=5600684163565994
    ```

    After authentication user is redirected back to url set in *redirect_uri* parameter. Query parameter *code* contains the authorization code which Your service will exchange for an access token.

    If the initial request contained a *state* parameter, the response also includes the exact value from the request. Your service must check if it matches one from initial request.

    ```bash
    https://example.com/auth/callback?code=CYD9MDm8gY2F8EhV&state=5600684163565994
    ```

3. Make POST request to [/token]() sending *client_id*, *client_secret*, *grant_type* and *code* (got from previous step). Parameter grant_type must always be "authorization_code".

    ```http
    POST /token HTTP/1.1
    Host: oauth.ee
    Content-Type: application/json; charset=utf-8
    Content-Length: 165

    {
      "client_id": "QVnPZGdcXQ8Ev4mx",
      "client_secret": "aLs6BLQfhd3dX8rUDnvQzmhZcVMNPnwy",
      "code": "CYD9MDm8gY2F8EhV",
      "grant_type": "authorization_code"
    }
    ```

    Response contains *access_token* what You need to get user information.
    ```json
    {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
      "expires_in": 3600,
      "token_type": "Bearer",
      "state": "5600684163565994"
    }
    ```



4. To get user information make GET request to [/user]() with *access_token* (got from previous step) as query parameter or as Bearer authorization header (preferred!).

    ```http
    GET /user HTTP/1.1
    Host: oauth.ee
    Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
    ```

    Response contains user information as JSON object.
    ```json
    {
      "idcode": "38001085718",
      "firstname": "JAAK-KRISTJAN",
      "lastname": "JÕEORG"
    }
    ```

## Setup & Run
1. Clone this repository and go to it's folder:
    ```shell
    git clone https://github.com/argoroots/est-o-auth.git ./est-o-auth
    cd est-o-auth
    ```
1. Rename _env.example_ to _.env_:
    ```shell
    cp .env.example .env
    ```
1. In _.env_ file, set correct domains for authentication and id-card services (Nginx needs separate domain for ID-Card authentication); e-mail address (to get Let's Encrypt cert expiration notifications) and some random string for JWT token signing.
    ```
    DOMAIN=auth.example.com
    IDCARD_DOMAIN=id.auth.example.com
    EMAIL=auth@example.com
    JWT_SECRET=Iel0jrC7fKFMjK2OBI4VYp2ygtrDQZBV
    ```
1. Generate HTTPS certificates:
    ```shell
    docker-compose --project-directory ./ -f ./docker-compose/certbot.yaml up --abort-on-container-exit
    ```
1. Renew HTTPS certificates - NB! run only when certificates are expiring and not on 1st setup:
    ```shell
    docker-compose --project-directory ./ -f ./docker-compose/certbot.yaml -f ./docker-compose/certbot-renew.yaml up --abort-on-container-exit
    docker-compose --project-directory ./ -f ./docker-compose/auth.yaml restart nginx
    ```

1. Get ID-Card certificates:
    ```shell
    docker-compose --project-directory ./ -f ./docker-compose/id-card.yaml up
    ```

1. Start service:
    ```shell
    docker-compose --project-directory ./ -f ./docker-compose/auth.yaml up -d --build --remove-orphans
    ```
