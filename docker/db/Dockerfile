FROM postgres:14-alpine
RUN mkdir /dockerscripts
COPY ./init.sh /docker-entrypoint-initdb.d
RUN chmod +x /docker-entrypoint-initdb.d/init.sh
WORKDIR /dockerscripts