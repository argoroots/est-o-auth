#!/bin/sh

apk upgrade --update-cache --available
apk add openssl
rm -rf /var/cache/apk/*

openssl dhparam -out ./dhparam.pem 4096
