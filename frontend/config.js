export default {"entities":{"attendance":{"joinTime":{"english":{"label":"Join Time"}},"leaveTime":{"english":{"label":"Leave Time"}},"timeInSession":{"english":{"label":"Time In Session"}},"dayNumber":{"english":{"label":"Day Number"}},"user":{"autoSuggestion":true,"isRequired":true,"canAddFromView":true,"dropDown":"emailId","english":{"label":"Email Id"}}},"city":{"name":{"english":{"label":"Name"}},"state":{"dropDown":"name","dropDownSecondaryField":"country.name","english":{"label":"State"}}},"college":{"name":{"english":{"label":"Name"}},"address":{"isRequired":true,"english":{"label":"Address"}},"contactNumber":{"isRequired":true,"english":{"label":"Contact Number"}},"isAICTEApproved":{"isRequired":true,"english":{"label":"Is AICTE Approved"}},"state":{"dropDown":"name","dropDownSecondaryField":"country.name","english":{"label":"State"}},"university":{"dropDown":"name","english":{"label":"University"}}},"country":{"name":{"english":{"label":"Name"}},"capital":{"english":{"label":"Capital"}},"states":{"autoSuggestion":true,"isRequired":true,"canAddFromView":true,"dropDown":"name","english":{"label":"States"}}},"designation":{"name":{"english":{"label":"Name"}}},"poll":{"type":{"isRequired":true,"enum":["Poll","Morning Quiz","Evening Quiz","Test"],"english":{"label":"Question Type"}},"question":{"autoSuggestion":true,"isRequired":true,"canAddFromView":true,"dropDown":"text"},"text":{"english":{"label":"Text"}},"workshop":{"autoSuggestion":true,"isRequired":true,"canAddFromView":true,"dropDown":"name","english":{"label":"Workshop"}}},"question":{"text":{"english":{"label":"Text"}},"option1":{"english":{"label":"Option 1"}},"option2":{"english":{"label":"Option 2"}},"option3":{"english":{"label":"Option 3"}},"option4":{"english":{"label":"Option 4"}},"correctOption":{"isRequired":true,"enum":["Option 1","Option 2","Option 3","Option 4"],"english":{"label":"Correct OOption"}}},"state":{"name":{"english":{"label":"Name"}},"country":{"dropDown":"name","english":{"label":"Country"}},"cities":{"editInEditForm":false,"dropDown":"name","english":{"label":"Cities"}},"zone":{"dropDown":"name","english":{"label":"Zone"}}},"university":{"name":{"english":{"label":"Name"}},"isDeemed":{"isRequired":true,"english":{"label":"Is Deemed University"}},"address":{"isRequired":true,"english":{"label":"Address"}},"contactNumber":{"isRequired":true,"english":{"label":"Contact Number"}},"state":{"dropDown":"name","dropDownSecondaryField":"country.name","english":{"label":"State"}}},"user-question-answer":{"user":{"autoSuggestion":true,"isRequired":true,"canAddFromView":true,"dropDown":"emailId","english":{"label":"Email Id"}},"question":{"autoSuggestion":true,"isRequired":true,"canAddFromView":true,"dropDown":"text"},"text":{"english":{"label":"Text"}},"answer":{"english":{"label":"Answer"}},"isCorrect":{"english":{"label":"Is Correct"}}},"user":{"emailId":{"english":{"label":"Email Id"}},"contactNumber":{"english":{"label":"Contact Number"}},"firstName":{"english":{"label":"First Name"}},"lastName":{"english":{"label":"Last Name"}},"designation":{"autoSuggestion":true,"isRequired":true,"canAddFromView":true,"dropDown":"name","english":{"label":"Designation"}},"state":{"autoSuggestion":true,"isRequired":true,"canAddFromView":true,"dropDown":"name","english":{"label":"State"}},"college":{"autoSuggestion":true,"isRequired":true,"canAddFromView":true,"dropDown":"name","english":{"label":"College"}},"workshops":{"autoSuggestion":true,"isRequired":true,"canAddFromView":true,"dropDown":"name","english":{"label":"Workshops"}}},"workshop":{"name":{"english":{"label":"Name"}},"workshopCode":{"english":{"label":"Workshop Code"}},"startDate":{"isRequired":true,"english":{"label":"Start Date"}},"endDate":{"isRequired":true,"english":{"label":"End Date"}}},"zone":{"name":{"english":{"label":"Name"}},"states":{"dropDown":"name","dropDownSecondaryField":"country.name","english":{"label":"States"}}}},"web":{"read":{"attendance":{"primaryField":"timeInSession","secondaryFields":["joinTime","leaveTime","dayNumber"],"user":{"fields":["emailId","firstName","lastName"]},"workshop":{"fields":["name","workshopCode"]}},"city":{"primaryField":"name","state":{"fields":["name"],"relationFields":["country.name"]}},"college":{"primaryField":"name","secondaryFields":["address","contactNumber","isAICTEApproved"],"state":{"fields":["name"]},"university":{"fields":["name"]}},"country":{"primaryField":"name","states":{"fields":["name"]}},"designation":{"primaryField":"name"},"poll":{"primaryField":"type","question":{"fields":["text"]},"workshop":{"fields":["name"]}},"question":{"primaryField":"text","secondaryFields":["option1","option2","option3","option4","correctOption"]},"state":{"primaryField":"name","country":{"fields":["name"]}},"university":{"primaryField":"name","secondaryFields":["isDeemed","address","contactNumber"],"state":{"fields":["name"],"relationFields":["country.name"]}},"user-question-answer":{"primaryField":"answer","secondaryFields":["answer","isCorrect"],"user":{"fields":["emailId","firstName","lastName"]},"question":{"fields":["text"]}},"user":{"primaryField":"emailId","secondaryFields":["contactNumber","firstName","lastName"],"state":{"fields":["name"],"relationFields":["country.name"]},"designation":{"fields":["name"]},"college":{"fields":["name"]},"workshops":{"fields":["name"]}},"workshop":{"primaryField":"name","secondaryFields":["workshopCode","startDate","endDate"]},"zone":{"primaryField":"name","states":{"fields":["name"],"relationFields":["country.name"]}}},"search":{"attendance":{"primaryField":"timeInSession","secondaryFields":["joinTime","leaveTime","dayNumber"],"user":{"fields":["emailId","firstName","lastName"]},"workshop":{"fields":["name","workshopCode"]}},"city":{"primaryField":"name","state":{"fields":["name"],"relationFields":["country.name"]}},"college":{"primaryField":"name","secondaryFields":["address","contactNumber","isAICTEApproved"],"state":{"fields":["name"]},"university":{"fields":["name"]}},"country":{"primaryField":"name","states":{"fields":["name"]}},"designation":{"primaryField":"name"},"poll":{"primaryField":"type","question":{"fields":["text"]},"workshop":{"fields":["name"]}},"question":{"primaryField":"text","secondaryFields":["option1","option2","option3","option4","correctOption"]},"state":{"primaryField":"name","country":{"fields":["name"]}},"university":{"primaryField":"name","secondaryFields":["isDeemed","address","contactNumber"],"state":{"fields":["name"],"relationFields":["country.name"]}},"user-question-answer":{"primaryField":"answer","secondaryFields":["answer","isCorrect"],"user":{"fields":["emailId","firstName","lastName"]},"question":{"fields":["text"]}},"user":{"primaryField":"emailId","secondaryFields":["contactNumber","firstName","lastName"],"state":{"fields":["name"],"relationFields":["country.name"]},"designation":{"fields":["name"]},"college":{"fields":["name"]},"workshops":{"fields":["name"]}},"workshop":{"primaryField":"name","secondaryFields":["workshopCode","startDate","endDate"]},"zone":{"primaryField":"name","states":{"fields":["name"],"relationFields":["country.name"]}}}},"frontendConfig":{"canNotBeCreatedEntities":[],"canNotBeSearchedEntities":[]}}