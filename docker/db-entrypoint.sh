echo "==> Creating root user..."
mongosh ${MONGO_DATABASE_NAME} \
  --host localhost \
  -u ${MONGO_INITDB_ROOT_USERNAME} \
  -p "${MONGO_INITDB_ROOT_PASSWORD}" \
  --authenticationDatabase admin \
  --eval "db.createUser({user: '${MONGO_USERNAME}', pwd: '${MONGO_PASSWORD}', roles:[{role:'dbOwner', db: '${MONGO_DATABASE_NAME}'}]})"

echo "==> Creating first record for _init collection"
mongosh ${MONGO_DATABASE_NAME} \
  --host localhost \
  -u ${MONGO_USERNAME} \
  -p "${MONGO_PASSWORD}" \
  --authenticationDatabase ${MONGO_DATABASE_NAME} \
  --eval "db.initCollection.insertOne({_id: 'init', createdAt: new Date()})"

echo "==> MongoDB init complete."