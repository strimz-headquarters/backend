mgt:
	export NODE_TLS_REJECT_UNAUTHORIZED='0' && cd src/api/v1/database && npx sequelize-cli db:migrate --env test

mgprod:
	export NODE_TLS_REJECT_UNAUTHORIZED='0' && cd src/api/v1/database && npx sequelize-cli db:migrate --env production


mc:
	cd src/api/v1/database && npx sequelize-cli migration:create --name ${name}

dev:
	cd src/api/v1/database && npx sequelize-cli db:migrate && mv $(shell pwd)/src/api/v1/database/dev.sqlite $(shell pwd)/ && npm run dev


