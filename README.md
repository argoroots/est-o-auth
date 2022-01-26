# Est-O-Auth

Use Estonian ID-card, Mobile-ID and Smart-ID as OAuth authentication provider

## Setup
1. Clone this repository and go to its folder:
    ```shell
    $ git clone https://github.com/argoroots/est-o-auth.git ./est-o-auth
    $ cd est-o-auth
    ```
1. Rename _env.example_ to _.env_:
    ```shell
    $ cp env.example .env
    ```
1. Set correct domains for authentication and id-card services (Nginx needs separate domain for ID-Card authentication)
1. Set correct e-mail address to get Let's Encrypt cert expiration notifications
1. Generate certs for HTTPS:
    ```shell
    $ docker-compose -f docker-compose-certbot-setup.yaml up --abort-on-container-exit
    ```

## Run service
To start oauth service run:
```shell
$ docker-compose up -d
```

## Renew certificates
To renew certificates run:
```shell
$ docker-compose -f docker-compose-certbot-setup.yaml up --abort-on-container-exit
$ docker-compose restart nginx
```

