var rehearsalModule = ( function () {

	var module = {};

	var MSEC_PER_MINUTE = 1000 * 60;
	var MSEC_PER_HOUR = MSEC_PER_MINUTE * 60;
	var NO_NEED_TO_REHEARSE = 0;
	var NEED_REHEARSAL_SOON = 1;
	var NEED_URGENT_REHEARSAL = 2; 

	var rehearsalSoonList;
	var urgentRehearsalList;

	function eachInterval (index) {
		if (index === 0) {
			return 12 * MSEC_PER_MINUTE;
		} else {
			return Math.pow(1.5, (index-1)) * MSEC_PER_HOUR * 12;
		}
	}

	function calculateTotalInterval (num) {
		var totalTime = 0;
		for (var i=0; i<num; i++) {
			totalTime += eachInterval(i);
		}
		return totalTime;
	}

	function extractDate (time) {
		var year = time.getFullYear();
		var date = time.getDate();
		var month = time.getMonth();
		var hour = time.getHours();
		var months = ['Jan', 'Feb', 'Mar', 'Apr', "May", 'June', 'July', 
				'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
		var hours = ['12AM', '1AM', '2AM', '3AM', '4AM', '5AM', '6AM', '7AM', 
				'8AM', '9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', 
				'4PM', '5PM', '6PM', '7PM', '8PM', '9PM', '10PM', '11PM'];
		return String.format( "{0} {1}, {2} {3}\'", 
				hours[hour], months[month], date, year);
	}

	//actual eachInterval func 
	// function eachInterval (index) {
	// 	if (index == 0) {
	// 		return 12 * msecPerHour; 
	// 	} else {
	// 		return Math.pow(1.5, (index-1)) * msecPerHour * 12;
	// 	}
	// }

	function rehearseStory (person, scene) {
		//update rehearsal time for story bank
		var story, date;
		var stories = programVariables.getStories();
		for (var i=0; i<stories.length; i++) {
			story = stories[i];
			if ( story.get('person') == person && 
					story.get('scene') == scene ) {
				//update story rehearse time
				date = new Date();
				//calculateElapsedTime(record.get('lastRehearsed'), date);
				story.set('lastRehearsed', date);
				story.set('totalRehearsal', story.get('totalRehearsal')+1);
				story.set('correctRehearsal', story.get('correctRehearsal')+1);

				// if that interval not satisfied
				//aka length of satisfactory less than that intervalNum
				if (story.get('rehearsalList').length() <= 
						story.get('intervalNum')) {
					//why a list?
					story.get('rehearsalList').push(true);
					story.set('intervalNum', story.get('intervalNum')+1);
				}
			}
		}
		$("#rehearsal-password").val('');
		$("#rehearsal-password-b").val('');
		$.mobile.changePage('#board');
	}

	function needRehearsal (originalDate, currentDate, record) {
		//first calculate the elapsedTime from starting position in millsecs
		var elapsedMills = currentDate.getTime() - originalDate.getTime();
		//get the intervalNum and calculate total
		var nextTimeInterval = calculateTotalInterval(
				record.get('intervalNum')+1 );
		var prevTimeInterval = calculateTotalInterval(
				record.get('intervalNum') );
		var elapsedSinceLastTime = elapsedMills - prevTimeInterval;
		var rehearsalInterval = nextTimeInterval - prevTimeInterval;

		if (elapsedSinceLastTime < rehearsalInterval * 0.75) {
			return NO_NEED_TO_REHEARSE;
		} else if ( (rehearsalInterval * 0.75 < elapsedSinceLastTime) && 
				(elapsedSinceLastTime < rehearsalInterval * 0.99) ) {
			return NEED_REHEARSAL_SOON;
		} else {
			return NEED_URGENT_REHEARSAL;
		}
	}

	function checkEachStory () {
		var story, originalDate, currentDate, check;
		urgentRehearsalList = [];
		rehearsalSoonList = [];
		var records = programVariables.getStories();
		for (var i=0; i<records.length; i++) {
			story = records[i];
			originalDate = story.get('created');
			currentDate = new Date();
			//if the story needs to be rehearsed display it in home page
			check = needRehearsal(originalDate, currentDate, story);
			if (check === NEED_URGENT_REHEARSAL) {
				urgentRehearsalList.push(story);
			} else if (check === NEED_REHEARSAL_SOON) {
				rehearsalSoonList.push(story);
			} else {
				//story safe what to do?
			}
		}
	}

	function calculateScoreForStory (story) {
		var c1 = 5;
		var c2 = 0.00001;
		var c3 = 10;
		var nextTimeInterval = 
				calculateTotalInterval( story.get('intervalNum')+1 );
		var originalDate = story.get('created');
		var currentDate = new Date();
		var part1 = c1 * ( story.get('intervalNum') + 1 );
		var part2 = c2 * (nextTimeInterval - 
				(currentDate.getTime() - originalDate.getTime()));
		var part3 = c3 * ( story.get('correctRehearsal' / 
				story.get('totalRehearsal')) );
		return part1 + part2 + part3;
	}

	//CONTROLLER
	module.checkEachStory = function () {
		checkEachStory();
	}
	module.rehearseStory = function (person, scene) {
		rehearseStory(person, scene)
	}
	module.renderRehearsalBoard = function () {
		renderRehearsalBoard();
	}

	module.renderRehearsalPage = function (person, scene) {
		renderRehearsalPage(person, scene);
	}

	module.extractDate = function (time) {
		extractDate(time);
	}

	module.calculateScoreForStory = function (story) {
		calculateScoreForStory(story);
	}
	//VIEW
	function replaceAll(find, replace, str) {
		return str.replace(new RegExp(find, 'g'), replace);
	}

	function renderRehearsalPage (person, scene) {
		var person_space = person
		var scene_space = scene
		var person = replaceAll(' ', '_', person);
		var scene = replaceAll(' ', '_', scene);

		var pageID = '#rehearsalPage';
		//initialize page
		if ( !($(pageID).length) ) {
			// var newPage = $("\
			// 		<div data-role='page' data-title='rehearsalPage' \
			// 		id='rehearsalPage'><div data-role='header' \
			// 		data-position=fixed><a href=#board data-icon='back'>Back\
			// 		</a><h1>Rehearsal</h1></div><div data-role='content' \
			// 		class=images><span id='personSceneDiv'></span><span \
			// 		data-role='fieldcontain'><form action='#'><span \
			// 		class='boxWidget'><input autocorrect='off' name='password'\
			// 		id='rehearsal-password' value='' placeholder='doing what' \
			// 		autofocus='autofocus' tabindex='1'/><input \
			// 		autocorrect='off' name='password2' \
			// 		id='rehearsal-password-b' value='' tabindex='2' \
			// 		placeholder='doing what'/></span><br><br><div \
			// 		class=halfbuttonDiv><a data-role='button' \
			// 		id='gameCheckNextButton' tabindex='3' class=right \
			// 		onclick='rehearsalModule.rehearseStory(\"" + person + "\", \"" 
			// 				+ scene + "\")' >Rehearse</a>\
			// 		<a href='#' class=left data-role='button' tabindex='4' \
			// 		onclick='recoveryMechanism.recoverStory()'>I Forget</a>\
			// 		</div></span></form></span></div></div>");
			var newPage = $("\
					<div data-role='page' data-title='rehearsalPage' \
					id='rehearsalPage'><div data-role='header' \
					data-position=fixed><a href=#board data-icon='back'>Back\
					</a><h1>Rehearsal</h1></div><div data-role='content' \
					class=images><span id='personSceneDiv'></span><span \
					data-role='fieldcontain'><form action='#'><span \
					class='boxWidget'><input type='text' autocorrect='off' \
					name='password' id='rehearsal-password' value='' \
					placeholder='doing' autofocus='autofocus' tabindex='1'/>\
					<input autocorrect='off' name='password2' \
					id='rehearsal-password-b' value='' tabindex='2' \
					placeholder='doing what'/></span><br><br><div \
					class=halfbuttonDiv><a data-role='button' \
					id='gameCheckNextButton' tabindex='3' class=right \
					onclick='rehearsalModule.rehearseStory(\"" + person + "\", \"" 
							+ scene + "\")' >Rehearse</a>\
					<a href='#' class=left data-role='button' tabindex='4' \
					onclick='recoveryMechanism.recoverStory()'>I Forget</a>\
					</div></span></form></span></div></div>");
					//recoverStory(i);// rehearseStory
			newPage.appendTo( $.mobile.pageContainer );
			memoryGame.getVerbComboBoxWrapper('rehearsal-password');
			memoryGame.getObjectComboBoxWrapper('rehearsal-password-b');
			$(pageID).page().page("destroy").page();
		}
		//put person and scene in the picture
		var html = "\
				<figure><img class=clue src=images/person/{0}.jpg />\
				<figcaption>{1}</figcaption></figure><figure><img class=clue \
				src=images/scene/{2}.jpg /><figcaption>{3}</figcaption>\
				</figure>";
		var newHTML = String.format( html, person, person_space, 
				scene.toLowerCase(), scene_space );
		$('#personSceneDiv').html(newHTML);
		//update box css 
		$('.boxWidget div').removeClass();
		$.mobile.changePage(pageID);
		$( "#recover" ).page( "destroy" ).page();

		$('#rehearsal-password').focus();
	}
	
	function renderRehearsalBoard () {
		var html = "Welcome back!";
		var buttonText = "";
		var boardText = "";
		var urgentLen = urgentRehearsalList.length;
		var soonLen = rehearsalSoonList.length;

		//no rehearsal due generate safe message 
		if ( (urgentLen === 0) && (soonLen === 0) ) {
			html += "<p>All stories are rehearsed on time. Great job! </p> \
					<p>Try do more rehearsals to increase your score.</p>";
			boardText = "<p>Great job! There are no rehearsals due.</p> \
					<p>Do extra rehearsals in story bank to increase your \
					score!</p><p><a href='#bank' data-role='button'>Go!</a>\
					</p>";
			//????
			$("#home-rehearsal").attr("href", "#bank");
		} else if (urgentLen === 0) {
			html += "<p>There are " + soonLen.toString() + 
					" stories that need to be rehearsed soon. Do them now!</p>";
			boardText = renderBoardFromList(
					rehearsalSoonList, NEED_REHEARSAL_SOON);
		} else if (soonLen === 0) {
			html += "<p>Oh no! There are " + urgentLen.toString() + 
					" stories that need to be rehearsed NOW!</p>";
			boardText = renderBoardFromList(
					urgentRehearsalList, NEED_URGENT_REHEARSAL);
		} else {
			html += "<p>We are really behind schedule! There are " + 
					urgentLen.toString() + " urgent reherasals, and " + 
					soonLen.toString() + " stories to be rehearsed soon.</p>";
			boardText = renderBoardFromList(
					urgentRehearsalList, NEED_URGENT_REHEARSAL);
			boardText += renderBoardFromList(
					rehearsalSoonList, NEED_REHEARSAL_SOON);
		} 
		//UPDATE HOME PAGE WHERE TO PUT THIS?
		//$('#')
		$('#home-words').html(html);
		$('#board-msg').html(boardText);
	}
	//rendering rehearsal Board
	function renderBoardFromList (list, flag) {
		var story, score, date, pair, newli;
		if (flag === NEED_URGENT_REHEARSAL) {
			title = "Urgent Rehearsals";
		} else if (flag === NEED_REHEARSAL_SOON ) {
			title = "Rehearsals";
		} else {
			alert('something is wrong!');
			return
		}
		var html = "<h3>" + title + "</h3><hr><div class='rehearsalBoard'>\
				<ul data-role='listview' data-inset='true' \
				class='rehearsalList'>";
		for (var i=0; i<list.length; i++) {
			story = list[i];
			score = Math.round( calculateScoreForStory(story) );
			date = extractDate( story.get('lastRehearsed') );
			pair = "<li class='boarditems'><span class='pairdiv'><figure>\
					<img class=pair src=images/person/{0}.jpg /><figcaption>\
					<p class='storyText'>{1}</p><p class='dateText'>{4}</p>\
					</figcaption></figure><figure><img class=pair \
					src=images/scene/{2}.jpg /><figcaption><p \
					class='storyText'>{3}</p><p class='scoreText'>Score:{5}</p>\
					</figcaption></figure></span></li>";
			newli = String.format(pair, story.get('person'), 
					story.get('person').replace('_', ' '), 
					story.get('scene').toLowerCase(),
					story.get('scene').replace('_', ' '), date, 
					score.toString());
			html += newli;
		}
		html += '</ul></div>';
		return html;
	}
	return module;
} () );