function Trie(key) {
	this.key = key;
	this.value;
}

Trie.prototype.put = function (name, value) {

	var node = this, 
		nameLength = name.length,
		i = 0,
		currentLetter;

	for (i = 0; i < nameLength; i++) {
		currentLetter = name[i];
		node = node[currentLetter] || 
				(node[currentLetter] = new Trie(currentLetter));
	}

	node.value = value;
	node.name = name;
};

Trie.prototype.get = function (name) {
	var node = this, nameLength = name.length, i, node;

	for (i = 0; i < nameLength; i++) {
		if (!(node = node[name[i]])) break;
	}

	return (i === nameLength) ? node.value : 'not found';
};