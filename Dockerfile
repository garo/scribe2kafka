FROM registry.applifier.info:5000/applifier-nodejs:0.10.29-1

COPY ./ /scribe2kafka/
ADD scribe2kafka.sv.conf /etc/supervisor/conf.d/

RUN cd /comet && npm config set color false && npm install

EXPOSE 1463
CMD supervisord -c /etc/supervisor.conf

