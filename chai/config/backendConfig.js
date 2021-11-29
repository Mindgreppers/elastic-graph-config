export default {"schema":{"auth_user":{"email":{"type":"string","name":"email"},"password":{"type":"string","name":"password"},"username":{"type":"string","name":"username"},"dob":{"type":"string","name":"dob"},"name":{"type":"string","autoSuggestion":true,"name":"name"},"prevNotificationTs":{"type":"date","name":"prevNotificationTs"}},"loan_app":{"description":{"type":"string","name":"description"},"loan_app_status":{"type":"string","name":"loan_app_status"},"is_active":{"type":"string","name":"is_active"},"is_deleted":{"type":"string","name":"is_deleted"},"borrower_first_name":{"type":"string","name":"borrower_first_name"},"borrower_last_name":{"type":"string","name":"borrower_last_name"},"co_borrower_first_name":{"type":"string","name":"co_borrower_first_name"},"co_borrower_last_name":{"type":"string","name":"co_borrower_last_name"},"borrower_father_name":{"type":"string","name":"borrower_father_name"},"borrower_mother_name":{"type":"string","name":"borrower_mother_name"},"borrower_dob":{"type":"date","name":"borrower_dob"},"borrower_pan":{"type":"string","name":"borrower_pan"},"product":{"isRelationship":true,"name":"product","type":"product","to":"product","cardinality":"one","inName":"loan_app","inCardinality":"many","dontStoreRelatedEntitiesInfo":false,"joinFrom":{"startingFromMe":{"index":{"loan_app":{"product":{"paths":[["product","name"]]}}}}}}},"product":{"name":{"type":"string","autoSuggestion":true,"name":"name","joinFrom":{"endingAtMe":{"index":{"loan_app":{"product":{"paths":[["product","name"]]}}}}}},"description":{"type":"string","name":"description"},"loan_app":{"isRelationship":true,"name":"loan_app","type":["loan_app"],"to":"loan_app","cardinality":"many","inName":"product","inCardinality":"one","dontStoreRelatedEntitiesInfo":false}}},"elasticsearch":{"maxConnections":200,"apiVersion":"7.4","requestTimeout":90000,"node":"http://localhost:9200","sniffOnStart":true},"collect":{"batchSizes":{"msearch":20,"index":20,"mget":20,"get":20,"search":20,"bulk":20},"timeouts":{"index":10,"get":10,"bulk":10,"mget":10,"msearch":10,"search":10}},"common":{"supportedLanguages":["english"],"pathTypes":["unionFrom","unionIn","unionFrom"],"organisation":"Pinelabs"},"custom":{},"entitiesInfo":{},"joins":{"index":{"loan_app":{"product":{"name":1},"description":1,"loan_app_status":1,"is_active":1,"is_deleted":1,"borrower_first_name":1,"borrower_last_name":1,"co_borrower_first_name":1,"co_borrower_last_name":1,"borrower_father_name":1,"borrower_mother_name":1,"borrower_dob":1,"borrower_pan":1}},"read":{},"search":{}},"invertedJoins":{"index":{"product":{"name":[{"path":["loan_app"],"joinAtPath":["product"]}]}},"read":{},"search":{}},"aggregations":{"loan_app":["product.name"]}}