FROM registry.applifier.info:5000/applifier-nodejs:0.10.29-1

COPY ./ /scribe2kafka/
ADD scribe2kafka.sv.conf /etc/supervisor/conf.d/

EXPOSE 1463
CMD supervisord -c /etc/supervisor.conf

