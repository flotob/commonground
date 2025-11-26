#!/bin/bash

CA_DIR="$1"
BASEDIR="$2"
COMMON_NAME="$3"
PASSKEY="$4"
SAN_IP1="$5"
SAN_IP2="$6"

LOGGING_PREFIX="gen_cert.sh >> "

if [ -d ${BASEDIR} ]
then
    rm -rf ${BASEDIR}
fi
mkdir -p ${BASEDIR}

echo "$PASSKEY" > ${BASEDIR}/passkey.txt

# generate a key for our certificate
echo 
echo "${LOGGING_PREFIX} Generating key for certificate"
openssl genrsa -des3 -passout pass:${PASSKEY} -out ${BASEDIR}/server.pass.key 4096
openssl rsa -passin pass:${PASSKEY} -in ${BASEDIR}/server.pass.key -out ${BASEDIR}/server.key
# we do not actually need the passkey, we keep our private key unencrypted
# rm ${BASEDIR}/${COMMON_NAME}.pass.key
echo

# create a certificate request.
echo
echo "${LOGGING_PREFIX} Creating certificate"
if [ -z "$SAN_IP1" ]
then
    openssl req -new -key ${BASEDIR}/server.key -out ${BASEDIR}/server.csr -subj "/emailAddress=infrastructure@cryptogram.sh/C=DE/ST=Bavaria/L=Bayreuth/O=cryptogram/OU=cryptogram GmbH & Co. KG/CN=${COMMON_NAME}" -reqexts SAN -config <(cat /etc/ssl/openssl.cnf <(printf "[SAN]\nsubjectAltName=DNS:localhost,DNS:${COMMON_NAME},IP:127.0.0.1"))
elif [ -z "$SAN_IP2" ]
then
    openssl req -new -key ${BASEDIR}/server.key -out ${BASEDIR}/server.csr -subj "/emailAddress=infrastructure@cryptogram.sh/C=DE/ST=Bavaria/L=Bayreuth/O=cryptogram/OU=cryptogram GmbH & Co. KG/CN=${COMMON_NAME}" -reqexts SAN -config <(cat /etc/ssl/openssl.cnf <(printf "[SAN]\nsubjectAltName=DNS:localhost,DNS:${COMMON_NAME},IP:127.0.0.1,IP:${SAN_IP1}"))
else
    openssl req -new -key ${BASEDIR}/server.key -out ${BASEDIR}/server.csr -subj "/emailAddress=infrastructure@cryptogram.sh/C=DE/ST=Bavaria/L=Bayreuth/O=cryptogram/OU=cryptogram GmbH & Co. KG/CN=${COMMON_NAME}" -reqexts SAN -config <(cat /etc/ssl/openssl.cnf <(printf "[SAN]\nsubjectAltName=DNS:localhost,DNS:${COMMON_NAME},IP:127.0.0.1,IP:${SAN_IP1},IP:${SAN_IP2}"))
fi

echo "${LOGGING_PREFIX} certificate signing request (${BASEDIR}/server.csr) is:"
openssl req -verify -in ${BASEDIR}/server.csr -text -noout
echo

# use our CA certificate and key to create a signed version of the certificate
echo 
echo "${LOGGING_PREFIX} Signing certificate using our root CA certificate and key"
if [ -z "$SAN_IP1" ]
then
    openssl x509 -req -sha512 -days 3650 -in ${BASEDIR}/server.csr -CA ${CA_DIR}/rootCA.crt -CAkey ${CA_DIR}/rootCA.key -CAcreateserial -out ${BASEDIR}/server.crt -extensions SAN -extfile <(cat /etc/ssl/openssl.cnf <(printf "[SAN]\nsubjectAltName=DNS:localhost,DNS:${COMMON_NAME},IP:127.0.0.1"))
elif [ -z "$SAN_IP2" ]
then
    openssl x509 -req -sha512 -days 3650 -in ${BASEDIR}/server.csr -CA ${CA_DIR}/rootCA.crt -CAkey ${CA_DIR}/rootCA.key -CAcreateserial -out ${BASEDIR}/server.crt -extensions SAN -extfile <(cat /etc/ssl/openssl.cnf <(printf "[SAN]\nsubjectAltName=DNS:localhost,DNS:${COMMON_NAME},IP:127.0.0.1,IP:${SAN_IP1}"))
else
    openssl x509 -req -sha512 -days 3650 -in ${BASEDIR}/server.csr -CA ${CA_DIR}/rootCA.crt -CAkey ${CA_DIR}/rootCA.key -CAcreateserial -out ${BASEDIR}/server.crt -extensions SAN -extfile <(cat /etc/ssl/openssl.cnf <(printf "[SAN]\nsubjectAltName=DNS:localhost,DNS:${COMMON_NAME},IP:127.0.0.1,IP:${SAN_IP1},IP:${SAN_IP2}"))
fi
chmod og-rwx ${BASEDIR}/server.key
echo "${LOGGING_PREFIX} certificate signed with our root CA certificate (${BASEDIR}/server.crt) is:"
openssl x509 -in ${BASEDIR}/server.crt -text -noout
echo

cat ${BASEDIR}/server.key ${BASEDIR}/server.crt > ${BASEDIR}/server-complete.pem

cp ${CA_DIR}/rootCA.crt ${BASEDIR}/rootCA.crt
cat ${CA_DIR}/rootCA-verification.pem > ${BASEDIR}/rootCA-verification.pem