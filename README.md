# Est-O-Auth

Use Estonian ID-card, Mobile-ID and Smart-ID as OAuth authentication provider

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
docker-compose --project-directory ./ -f ./docker-compose/auth.yaml up -d --remove-orphans
```

## Renew certificates
To renew certificates run:
```shell
docker-compose --project-directory ./ -f ./docker-compose/certbot.yaml -f ./docker-compose/certbot-renew.yaml up --abort-on-container-exit
docker-compose restart nginx
```
