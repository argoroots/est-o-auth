#!/bin/sh

mkdir ./certs

rm ./certs/*.crt

wget -qnv -P ./certs https://c.sk.ee/EE-GovCA2018.pem.crt
wget -qnv -P ./certs https://c.sk.ee/esteid2018.pem.crt
wget -qnv -P ./certs https://www.sk.ee/upload/files/EE_Certification_Centre_Root_CA.pem.crt
wget -qnv -P ./certs https://www.sk.ee/upload/files/ESTEID-SK_2011.pem.crt
wget -qnv -P ./certs https://www.skidsolutions.eu/upload/files/ESTEID-SK_2015.pem.crt

cat ./certs/*.crt > ./id-card.pem.crt
