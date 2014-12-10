var programVariables = programVariables || {};

programVariables.DROPBOX_APP_KEY = '8qw6cevpayp0vyd';
programVariables.client = new Dropbox.Client({key: programVariables.DROPBOX_APP_KEY});
programVariables.datastore = null;

programVariables.storyBank;
programVariables.accounts;
programVariables.stories;
programVariables.accountIndex;
programVariables.securitySetting;

var tempStartingInterval = 1000 * 60;

programVariables.initialize = function (){
	programVariables.client.getDatastoreManager().openDefaultDatastore(function (error, datastore) {
		if (error) {
			alert('Error opening default datastore: ' + error);
		} 
		programVariables.datastore = datastore;
		programVariables.storyBankTable = datastore.getTable('stories');
		programVariables.accountTable = datastore.getTable('accounts');
		programVariables.generalTable = datastore.getTable('general');
		programVariables.storyModeGeneralTable = datastore.getTable('storyModeGeneral');

		programVariables.generalRecord = programVariables.storyModeGeneralTable.query();
		programVariables.stories = programVariables.storyBankTable.query();
		programVariables.accounts = programVariables.accountTable.query();

		//programVariables.storyBank = programVariables.stripStoryFromRecords();
		programVariables.programRecord = programVariables.generalTable.query();


		if (programVariables.generalRecord.length === 0) {
			//if security Level has not been set go to that page and store information generated 
			//change to usability-security scale page
			$.mobile.changePage($("#userSelect"))
			//initialize account index to be 0
			storyMode.setAccountIndex(0);
			//window.location = "https://smoothpass.github.io/index.html#userSelect";

		} else if (programVariables.generalRecord.length === 1) {
			programVariables.generalRecord = programVariables.generalRecord[0];
			var record = programVariables.generalRecord;
			// load values to storyMode module
			storyMode.setSecurityLevel(record.get('securityLevel'));
			storyMode.setAccountIndex(record.get('accountIndex'));
			storyMode.setGroupList(record.get('groupList').toArray());
			storyMode.setGroupHashesList(
					record.get('groupHashesList').toArray());
			storyMode.setGroupSaltList(record.get('groupSaltList').toArray());
			//change to storyBank page
			if (!$.mobile.activePage.is("#board")){
				$.mobile.changePage($("#board"));
			}
			//window.location = "https://smoothpass.github.io/index.html#board";
		} else {
			//should never get here since generalTable should only have one entry
			alert('something is wrong please contact our developer');
		}

		if (programVariables.stories.length === 0) {
			storyMode.emptyStoryBank();
		} else {
			var tempBank = [];
			for (var i=0; i<programVariables.stories.length; i++) {
				var story = programVariables.stories[i];
				tempBank.push([story.get('person'), story.get('scene')]);
			}
			storyMode.setStoryBank(tempBank);
		}
		// if (programVariables.programRecord.length == 0) {
		// 	//initialize values
		// 	programVariables.insertProgramRecord(programVariables.generalTable);
		// } else if (programVariables.programRecord.length == 1) {
		// 	programVariables.programRecord = programVariables.programRecord[0];
		// 	var tempRecord = programVariables.programRecord;
		// 	//load stored values
		// 	programVariables.accountIndex = tempRecord.get('accountIndex');
		// 	programVariables.existingAccountIndex = tempRecord.get('existingAccountIndex');
		// 	programVariables.existingAccounts = tempRecord.get('existingAccounts');
		// 	programVariables.existingPersonList = tempRecord.get('existingPersonList');
		// 	programVariables.existingSceneList = tempRecord.get('existingSceneList');
 		// Populate Initial Bank & Account List

 		storyMode.updateStoryBankList();
 		accountPage.updateAccountList();

 		//Ensure future changes update the list 
 		programVariables.datastore.recordsChanged.addListener(
 				storyMode.updateStoryBankList);
		programVariables.datastore.recordsChanged.addListener(
				accountPage.updateAccountList);	
		console.log('accountLoaded Successfully');
		rehearsalModule.checkEachStory();
		rehearsalModule.renderRehearsalBoard();
		$('ul.rehearsalList li').on('click',
			function (e) {
				e.preventDefault();
				var textList = $(this).find(".storyText");
				var person = textList[0].innerHTML;
				var scene = textList[1].innerHTML;
				rehearsalModule.renderRehearsalPage(person, scene);
			});
		//UI Change after logging in REFER TO pm.js
	});
	return true;
}

programVariables.getGroupFromRecordIndices = function(start, end) {
	var records = programVariables.storyBankTable.query();
	var group = [];
	for (var i = start; i < end; i++ ){
		var record = records[i];
		group.push([record.get('person'), record.get('scene'), record.get('used')]);
	}
	return group;
}

programVariables.insertRecord = function (level, groupList, groupHashFlattened, groupSaltList) {
	programVariables.storyModeGeneralTable.insert({
		securityLevel: level,
		accountIndex: 0,
		groupList: groupList,
		groupHashesList: groupHashFlattened,
		groupSaltList: groupSaltList
	});
}

programVariables.insertStory = function (personName, sceneName, usedBool, groupNum) {
	programVariables.storyBankTable.insert({
		person: personName,
		scene: sceneName,
		used: usedBool,
		created: new Date(),
		initialized: new Date(),
		lastRehearsed: new Date(),
		groupNumber: groupNum,
		refCount: 0,
		refList: [],
		intervalNum: 0,
		rehearsalList: [],
		correctRehearsal: 1,
		totalRehearsal: 1,
		interval: tempStartingInterval
	});
}

programVariables.insertAccount = function (accountName, storyList, index, ruleList) {	
	//do nothing currently should do the following
	programVariables.accountTable.insert({
		account:accountName,
		created: new Date(),
		lastRehearsal: new Date(),
		storyList: storyList,
		accountIndex: index,
		rules: ruleList
	});
}

programVariables.insertProgramRecord = function (generalTable) {
	generalTable.insert({
		accountIndex : 0,
		existingAccountIndex : 0,
		existingAccounts : [],
		existingSceneList : [],
		existingPersonList : []
	});
}

programVariables.updateStoryRefCount = function (accountName, accountNestedList) {
 	// fill later
}


programVariables.stripStoryFromRecords = function() {
	var records = programVariables.storyBankTable.query();
	var storyList = [];
	for (var i = 0; i < records.length; i++ ){
		var record = records[i];
		storyList.push([record.get('person'), record.get('scene')]);
	}
	return storyList;
}

programVariables.parseStringToNestedArrays = function (stringOfArray) {
	var result = [];
	for (var i=0; i < stringOfArray.length(); i++) {
		var li = stringOfArray.get(i).split('|||'); 
		result.push(li);
	}
	return result;
}