# OAuth.ee

Use E-mail or Estonian ID-card, Mobile-ID and Smart-ID as OAuth authentication provider

## Usage
1. Redirect user to one of the following url:
    - [/auth/id-card]()
    - [/auth/mobile-id]()
    - [/auth/smart-id]()
    - [/auth/e-mail]()
    - [/auth]() - *will ask user the preferred auth method*

    Required query parameters:
    - response_type - *always equals to "code"*
    - client_id
    - redirect_uri
    - scope
    - state

    Optional parameters - if not set, user must input required ones (depends of auth method):
    - phone - *only for [/auth/mobile-id]()*
    - idc - *only for [/auth/mobile-id]() and [/auth/smart-id]()*
    - email - *only for [/auth/e-mail]()*
    - methods - *only for [/auth]() - comma separated list of auth methods to show (id-card, mobile-id, smart-id, e-mail)*

    ```bash
    https://oauth.ee/auth/mobile-id?response_type=code&client_id=QVnPZGdcXQ8Ev4mx&redirect_uri=https://example.com/auth/callback&scope=&state=5600684163565994
    ```

    After authentication user is redirected back to url set in *redirect_uri* parameter. Query parameter *code* contains the authorization code which Your service will exchange for an access token.

    If the initial request contained a *state* parameter, the response also includes the exact value from the request. Your service must check if it matches one from initial request.

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

## Run service

### Setup
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
1. Generate certs for HTTPS:
    ```shell
    docker-compose --project-directory ./ -f ./docker-compose/certbot.yaml up --abort-on-container-exit
    ```
1. Get ID-Card certs:
    ```shell
    docker-compose --project-directory ./ -f ./docker-compose/id-card.yaml up
    ```
1. Build front-end:
    ```shell
    docker-compose --project-directory ./web -f ./docker-compose/build.yaml up --build --abort-on-container-exit
    ```

### Run service
To start oauth service run:
```shell
docker-compose --project-directory ./api -f ./docker-compose/auth.yaml up -d --build --remove-orphans
```

### Renew certificates
To renew certificates run:
```shell
docker-compose --project-directory ./ -f ./docker-compose/certbot.yaml -f ./docker-compose/certbot-renew.yaml up --abort-on-container-exit
docker-compose --project-directory ./api -f ./docker-compose/auth.yaml restart nginx
```
