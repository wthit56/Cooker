function on(dom, event, listener) {
	dom.addEventListener(event, listener);
}

var dishes = { list: [], byName: {} };

function add(name, time, temperature) {
	if (name in dishes.byName) { return new Error("Duplicate name. Please change the name and try again."); }
	else {
		var dish = { name: name, time: time, temperature: temperature };
		dishes.list.push(dish);
		dishes.byName[name] = dish;
		return dish;
	}
}

function recalc() {
	var modeByValue = {};
	var max = { value: 0, count: -1 };
	dishes.list
		.sort(function(a, b) { return b.temperature - a.temperature; })
		.forEach(function(dish) {
		var count;
		if (dish.temperature in modeByValue) {
			count = ++modeByValue[dish.temperature];
		}
		else {
			count = modeByValue[dish.temperature] = 1;
		}
		
		if (count > max.count) {
			max.value = dish.temperature;
			max.count = count;
		}
	}, 0);
	var heat = max.value;
	
	var result = [].concat(
		{ type: "preheat", temperature: heat },
		dishes.list.map(function(dish) {
			return { dish: dish, time: (dish.temperature * dish.time) / heat };
		}).sort(function(a, b) {
			return b.time - a.time;
		}).map(function(calc, i, a) {
			return { type: "put", dish: calc.dish, time: calc.time + (i < a.length - 1 ? -a[i + 1].time : 0) };
		})
	);
	return result;
}

var instructions = document.getElementById("instructions");

function render(data) {
	instructions.innerHTML = data.map(function(inst) {
		if (inst.type === "preheat") {
			return '<li id="preheat"><span class="text">Preheat at <em>' + inst.temperature + '</em></span></li>';
		}
		else {
			var time = renderTime(inst.time);
			
			return '<li data-dish-name="' + inst.dish.name + '" title="Original instructions: ' + inst.dish.time + ' minute' + (inst.dish.time !== 1 ? 's' : '') + ' at ' + inst.dish.temperature + '"><span class="text">Put <em>' + inst.dish.name + '</em> in</span><span class="controls"><button class="edit">Edit</button><button class="remove">Remove</button></span></li>' + 
			(inst.time > 0 ? '<li data-timer-mins="' + inst.time + '"><span class="text">Wait for <em>' + time + '</em></span><span class="controls"><button class="start">Start</button></span></li>' : '');
		}
	}).join("\n") + '\n' +
	'<li class="complete"><span class="text"><em>Cooking Complete!</em></span></li>';
}

function renderTime(time) {
	time = time * 60;
	var secs = time % 60;
	var mins = (time - secs) / 60;
	time = (mins ? Math.floor(mins) + " minute" + (mins !== 1 ? "s" : "") : "") +
		(secs ? (mins ? ", " : "") + Math.floor(secs) + " second" + (secs !== 1 ? "s" : "") : "")
	return time;
}

(function setup_add() {
	var name = document.getElementById("add-name-input"),
		time = document.getElementById("add-time-input"),
		temperature = document.getElementById("add-temperature-input");
		
	add.dom = { name: name, time: time, temperature: temperature };
	
	on(document.getElementById("add-submit"), "click", function(e) {
		var result = add(name.value, +time.value, +temperature.value);
		if (result instanceof Error) {
			alert(result.message);
		}
		else {
			name.value = "";
			time.value = "";
			temperature.value = "";
			render(recalc());
		}
	});
})();

var timers = []; (function setup_timers() {
	var i, l;
	setInterval(function() {
		var now = new Date();
		for (i = 0, l = timers.length; i < l; i++) {
			if (timers[i].timer <= now) {
				next(timers[i]);
				timers.splice(i, 1); i--; l--;
			}
			else {
				timers[i].display.innerHTML = renderTime((timers[i].timer - now) / 60000);
			}
		}
	}, 1000);
})();
on(instructions, "click", function(e) {
	if (e.target.tagName === "BUTTON") {
		var button = e.target, parent = e.target;
		while (parent.parentNode && (parent.tagName !== "LI")) { parent = parent.parentNode; }
		if (("timerMins" in parent.dataset) && (button.className === "start") && !parent.timer) {
			var timer = parent.timer = new Date();
			timer.setSeconds(timer.getSeconds() + (parent.dataset.timerMins * 60));
			timers.push(parent);
			parent.display = parent.getElementsByTagName("EM")[0];
			button.disabled = true;
		}
		else if ("dishName" in parent.dataset) {
			if ((button.className !== "edit") && (button.className !== "delete")) { throw new Error("Invalid click within 'put in' instruction."); }
			
			var dish = dishes.byName[parent.dataset.dishName];
			delete dishes.byName[parent.dataset.dishName];
			dishes.list.splice(dishes.list.indexOf(dish), 1);
			
			if (button.className === "edit") {
				add.dom.name.value = dish.name;
				add.dom.time.value = dish.time;
				add.dom.temperature.value = dish.temperature;
			}
			
			dish = null;
			render(recalc());
		}
	}
});

function next(inst) {
	inst.style.opacity = 0.5;
	
	var nextInst = inst.nextElementSibling;
	alert("Cooking needs your attention!");
}

add("Pizza", 12, 160);
add("Chips", 10, 200);
add("Other Pizza", 9.95, 200);
render(recalc());