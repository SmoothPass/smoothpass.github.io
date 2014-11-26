var appConstants = (function () {
	var module = {};
	var people = [ 
			"Adolf_Hitler", "Alfred_Hitchcock", "Angelina_Jolie", 
			"Audrey_Hepburn", "Barack_Obama", "Bart_Simpson", "Beethoven",
			"Ben_Affleck", "Benjamin_Franklin", "Beyonce", "Bill_Clinton", 
			"Bill_Gates", "Brad_Pitt", "Bruce_Lee", "Charlie_Chaplin",
			"Christopher_Columbus", "Darth_Vader", "David_Beckham", "Einstein", 
			"Elvis_Presley", "Frankenstein", "Frodo", "Gandalf", "Gandhi",
			"George_W_Bush", "George_Washington", "Harry_Potter", 
			"Hillary_Clinton", "Homer_Simpson", "Indiana_Jones", "Jay-Z", 
			"Jennifer_Lopez", "Jimmy_Fallon", "Joe_Biden", "John_Lennon",
			"Johnny_Depp", "Justin_Timberlake", "Kim_Jong_Un", "Kobe_Bryant", 
			"Lady_Gaga", "Lebron_James", "Leonardo_da_Vinci", 
			"Leonardo_DiCaprio", "Madonna", "Marilyn_Monroe", "Mark_Twain", 
			"Mark_Zuckerberg", "Martin_Luther_King_Jr", "Michael_Jackson", 
			"Michael_Jordan", "Michael_Phelps", "Michelle_Obama", 
			"Mickey_Mouse", "Mona_Lisa", 'Morgan_Freeman', "Mozart", 
			"Neil_Armstrong", "Nelson_Mandela", "Oprah_Winfrey", "Pope_Francis",
			"Princess_Diana", "Rand_Paul", "Ron_Paul", "Ronald_Reagan", 
			"Sherlock_Holmes", "Sir_Issac_Newton", "Stephen_Hawking", 
			"Steve_Jobs", "Superman", "Thomas_Edison",  "Tiger_Woods", 
			"Vincent_Van_Gogh", "Vladimir_Putin", "William_Shakespeare" 
		]; //74

	var actions = [ 
			'balancing', 'bending', 'biting', 'bouncing', 'building', 'burning',
			'chasing', 'clapping', 'climbing' ,'cooking', 'digging', 'drinking',
			'enlarging', 'exploding', 'feeding', 'fighting', 'flipping', 
			'gnawing', 'hanging', 'hiding', 'hugging', 'juggling', 'kissing', 
			'lassoing', 'licking', 'oiling', 'painting', 'piloting', 'pushing', 
			'repairing', 'rowing', 'rubbing', 'saving', 'scratching', 'signing',
			'sipping', 'shooting', 'stewing', 'smelling', 'swallowing',
			'swinging', 'taping', 'tattooing', 'throwing', 'tickling','tugging',
			'tying', 'washing', 'wrapping', 'zooming'
		]; //#50
	var actionIndices = [];
	actionIndices[""] = "";
	for (var i=0; i<actions.length; i++) {
		actionIndices[actions[i]] = i;
	}
	var objects = [
			'ant', 'boot', 'bunny', 'bus', 'calf', 'chandelier', 'cow', 
			'cupcake', 'daisy', 'dandelion', 'dice', 'dome', 'dove', 'hammer', 
			'heel', 'hen', 'hourglass', 'hydrant', 'igloo', 'ladder', 'ladybug',
			'leaf', 'lemon', 'lime', 'lipstick', 'lock', 'lollipop', 'map', 
			'moon', 'moose', 'owl', 'peach', 'piano', 'pizza', 'safe', 'saw',
			'seal', 'shark', 'shoe', 'smore', 'snowflake', 'stapler', 'suit',
			'sumo', 'teacup', 'teepee', 'tiger', 'toaster', 'toilet', 
			'tricycle', 'violin'
		]; //#51
	var objectIndices = [];	
	objectIndices[""] = "";
	for (var i=0; i<objects.length; i++) {
		objectIndices[objects[i]] = i;
	}
	var scenes = [ 
			'airport', 'aquarium', 'baseball_field', 'basketball_court', 
			'bakery', 'Big_Ben', 'bridge', 'Capitol_Hill', 'castle', 'cliff',
			'clouds', 'court', 'Eiffel_Tower', 'factory', 'fancy_house', 'farm',
			'fitness_center', 'forest', 'garden', 'garage', 'Great_Sphynx', 
			'glacier', 'Grand_Canyon', 'Great_Wall', 'hanging_bridge',
			'hotel_room', 'island', 'lake', 'library', 'lighthouse', 'museum', 
			'mountain', 'Niagara_Falls', 'ocean', 'office', 'park', 'pool_bar', 
			'pyramids', 'restaurant', 'sailboat', 'snowy_mountain', 
			'Statue_of_Liberty', 'swimming_pool', 'Sydney_Opera_House', 
			'Taj_Mahal', 'Tower_of_Pisa', 'tropical_beach', 'waterfall', 
			'wharf', 'windmills', 'zoo'
		]; //51

	//CONTROLLER
	module.getPeopleList = function () {
		return people;
	}
	module.getActionsList = function () {
		return actions;
	}
	module.getObjectsList = function () {
		return objects;
	}
	module.getScenesList = function () {
		return scenes;
	}
	module.getStrObjIndex = function (obj) {
		return "o" + (objectIndices[obj].toString());
	}
	module.getStrActIndex = function (act) {
		return "a" + (actionIndices[act].toString());
	}
	return module;
}());