openssl genpkey -algorithm RSA -out key.pem
openssl req -new -key key.pem -out csr.pem
openssl req -x509 -key key.pem -out cert.pem -days 30 -config openssl.cnf