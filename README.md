# OAuth.ee

Use E-mail or Estonian ID-card, Mobile-ID and Smart-ID as OAuth authentication provider

## Usage
1. Redirect user to one of the following url:
    - [/auth/id-card]()
    - [/auth/mobile-id]()
    - [/auth/smart-id]()
    - [/auth/e-mail]()

    Required query parameters are:
    - response_type (always equals to "code")
    - client_id
    - redirect_uri
    - scope
    - state
    - phone (only for [/auth/mobile-id]())
    - idc (only for [/auth/mobile-id]() and [/auth/smart-id]())
    - email (only for [/auth/e-mail]())

    After authentication user is redirected back to url set in *redirect_uri* parameter. Query parameter *code* contains the authorization code which Your service will exchange for an access token.

    If the initial request contained a *state* parameter, the response also includes the exact value from the request. Your service must check if it matches one from initial request.

3. Make POST request to [/token]() sending *grant_type* and *code* (got from previous step). Parameter grant_type must always be "authorization_code".

    Response contains *access_token* what You need to get user information.

4. To get user information make GET request to [/user]() with *access_token* (got from previous step) as query parameter or as Bearer authorization header (preferred!).

    Response contains user information as JSON object.

## Setup
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

## Run service
To start oauth service run:
```shell
docker-compose --project-directory ./api -f ./docker-compose/auth.yaml up -d --build --remove-orphans
```

## Renew certificates
To renew certificates run:
```shell
docker-compose --project-directory ./ -f ./docker-compose/certbot.yaml -f ./docker-compose/certbot-renew.yaml up --abort-on-container-exit
docker-compose restart nginx
```
