#!/bin/bash

BASEDIR="$1"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
LOGGING_PREFIX="gen_root_cert.sh >> "

PASSKEY="$2"

if [ -d ${BASEDIR} ]
then
    rm -rf ${BASEDIR}
fi
mkdir -p ${BASEDIR}

echo "$PASSKEY" > ${BASEDIR}/passkey.txt

# generate a key for our root CA certificate
echo "${LOGGING_PREFIX} Generating key for root CA certificate"
openssl genrsa -des3 -passout pass:${PASSKEY} -out ${BASEDIR}/rootCA.pass.key 4096
openssl rsa -passin pass:${PASSKEY} -in ${BASEDIR}/rootCA.pass.key -out ${BASEDIR}/rootCA.key
rm ${BASEDIR}/rootCA.pass.key
echo

# create and self sign the root CA certificate
echo
echo "${LOGGING_PREFIX} Creating self-signed root CA certificate"
openssl req -x509 -new -nodes -key ${BASEDIR}/rootCA.key -sha512 -days 365000 -out ${BASEDIR}/rootCA.crt -subj "/emailAddress=infrastructure@cryptogram.sh/C=DE/ST=Bavaria/L=Bayreuth/O=cryptogram/OU=cryptogram GmbH & Co. KG/CN=cryptogram-pg-ca" -extensions v3_ca -config ${SCRIPT_DIR}/openssl.cnf
echo "${LOGGING_PREFIX} Self-signed root CA certificate (${BASEDIR}/rootCA.crt) is:"
openssl x509 -in ${BASEDIR}/rootCA.crt -text -noout
echo

cat ${BASEDIR}/rootCA.crt > ${BASEDIR}/rootCA-verification.pem
cat ${BASEDIR}/rootCA.key ${BASEDIR}/rootCA.crt > ${BASEDIR}/rootCA-complete.pem
