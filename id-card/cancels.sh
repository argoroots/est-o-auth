#!/bin/sh

apk upgrade --update-cache --available
apk add openssl
rm -rf /var/cache/apk/*

mkdir ./cancels

rm ./cancels/*.crl

wget -qnv -P ./cancels https://c.sk.ee/EE-GovCA2018.crl
wget -qnv -P ./cancels https://c.sk.ee/esteid2018.crl
wget -qnv -P ./cancels https://www.sk.ee/crls/eeccrca/eeccrca.crl
wget -qnv -P ./cancels https://www.sk.ee/repository/crls/esteid2011.crl
wget -qnv -P ./cancels https://www.sk.ee/crls/esteid/esteid2015.crl
wget -qnv -P ./cancels https://www.sk.ee/crls/klass3/klass3-2010.crl
wget -qnv -P ./cancels https://www.sk.ee/repository/crls/eid2011.crl

openssl crl -in ./cancels/EE-GovCA2018.crl -out ./cancels/EE-GovCA2018.pem.crl -inform DER
openssl crl -in ./cancels/esteid2018.crl -out ./cancels/esteid2018.pem.crl -inform DER
openssl crl -in ./cancels/eeccrca.crl -out ./cancels/eeccrca.pem.crl -inform DER
openssl crl -in ./cancels/esteid2011.crl -out ./cancels/esteid2011.pem.crl -inform DER
openssl crl -in ./cancels/esteid2015.crl -out ./cancels/esteid2015.pem.crl -inform DER
openssl crl -in ./cancels/klass3-2010.crl -out ./cancels/klass3-2010.pem.crl -inform DER
openssl crl -in ./cancels/eid2011.crl -out ./cancels/eid2011.pem.crl -inform DER

cat ./cancels/*.pem.crl > ./id-card.cancels.pem.crl
