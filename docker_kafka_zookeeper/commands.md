RUN CONSUMER from /opt/kafka
./bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic topic.1 --from-beginning