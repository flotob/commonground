FROM nginx
ARG SERVER_NAME
ARG CGID_SERVER_NAME
SHELL ["/bin/bash", "-c"]
COPY ./nginx.conf /etc/nginx/
ADD ./dist /www/
RUN chown -R www-data:www-data /www
RUN sed -i -e "s/{SERVER_NAME}/$SERVER_NAME/g" /etc/nginx/nginx.conf
RUN sed -i -e "s/{CGID_SERVER_NAME}/$CGID_SERVER_NAME/g" /etc/nginx/nginx.conf
RUN printf "Sitemap: https://$SERVER_NAME/sitemap.xml\n" >> /www/robots.txt