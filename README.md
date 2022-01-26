# Est-O-Auth

Use Estonian ID-card, Mobile-ID and Smart-ID as OAuth authentication provider

## Setup

1. Rename _env.example_ to _.env_
    ```shell
    $ cp env.example .env
    ```
1. Set correct domains for authentication and id-card services (Nginx needs separate domain for ID-Card authentication)
1. Set correct e-mail address to get Let's Encrypt cert expiration notifications

## Run
Start Docker Compose
```shell
$ docker-compose up -d
```
