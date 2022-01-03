class Vector {
	constructor(x = 0, y = 0) {
		this.x = x;
		this.y = y;
	}
	
	add(v) {
		this.x += v.x;
		this.y += v.y;
		
		return this;
	}
	
	clone() {
		return new Vector(this.x, this.y);
	}
}

class EventEmitter {
	constructor() {
		this.events = {};
	}
	
	on(eventName, handler) {
		if (!this.events[eventName]) {
			this.events[eventName] = [];
		}
		
		this.events[eventName].push(handler);
	}
	
	trigger(eventName, ...args) {
		if (!this.events[eventName]) return;
		
		this.events[eventName]
			.forEach(handler => handler(...args));
	}
}

class Leaf {
	constructor(position, heading, size = 8) {
		this.position = position;
		this.heading = heading;
		this.size = size;
	}
	
	render(context) {
		const positionNew = this.position.clone().add(new Vector(
			Math.cos(this.heading) * this.size,
			Math.sin(this.heading) * this.size
		));
		
		context.beginPath();
		context.moveTo(this.position.x, this.position.y);
		context.lineTo(positionNew.x, positionNew.y);
		
		context.lineWidth = 1;
		context.strokeStyle = '#040';
		context.stroke();
	}
}

class Branch extends EventEmitter {
	constructor(position, heading, size, depth = 0) {
		super();
		
		this.position = position;
		this.heading = heading;
		this.size = size;
		this.depth = depth;
	}
	
	render(context) {
		if (this.size <= 1) {
			this.trigger('die', this);
			return;
		}
		
		const step = 1.2;
		const positionNew = this.position.clone().add(new Vector(
			Math.cos(this.heading) * step,
			Math.sin(this.heading) * step
		));
		
		context.beginPath();
		context.moveTo(this.position.x, this.position.y);
		context.lineTo(positionNew.x, positionNew.y);
		
		context.lineWidth = this.size;
		context.strokeStyle = '#621';
		context.stroke();
		
		this.size -= 0.025;
		
		if (Math.random() < .8) this.trigger('spawnLeaf', this);
		if (Math.random() < .2) this.trigger('spawnBranch', this);
		
		this.position = positionNew;
	}
}

const birand = () => Math.random() * 2 - 1;

const canvas = document.createElement('canvas');
canvas.height = window.innerHeight;
canvas.width = window.innerWidth;

const context = canvas.getContext('2d');

const onWalkerDie = (walker) => {
	const index = walkers.indexOf(walker);
	if (index >= 0) walkers.splice(index, 1);
};

const getHeading = (parent) => {
	const variation = birand() * Math.PI * .25;
	return parent.heading + variation;
};
const getHeadingBase = (parent) => {
	const direction = Math.random() < .5 ? -1 : 1;
	
	const variation = Math.sqrt(Math.random()) * direction * Math.PI * .5;
	return Math.PI * .5 + variation;
};

const spawnLeaf = (parent) => {
	const position = parent.position.clone();
	const heading = parent.heading + birand() * Math.PI * .25;
	
	const leaf = new Leaf(position, heading, 8 + parent.size);
	leaf.render(context);
};

const spawnBranch = (parent) => {
	const position = parent.position.clone();
	const heading = parent.depth ? getHeading(parent) : getHeadingBase(parent);
	const size = parent.size * .6;
	
	const branch = new Branch(position, heading, size, parent.depth + 1);
	branch.on('spawnBranch', spawnBranch);
	branch.on('spawnLeaf', spawnLeaf);
	branch.on('die', onWalkerDie);
	
	walkers.push(branch);
};

const walkers = [];

const start = () => {
	walkers.length = 0;
	context.clearRect(0, 0, canvas.width, canvas.height);
	
	const base = new Branch(
		new Vector(canvas.width * .5, canvas.height * .75),
		Math.PI * -.5,
		10
	);

	base.on('spawnBranch', spawnBranch);
	base.on('spawnLeaf', spawnLeaf);
	base.on('die', onWalkerDie);
	walkers.push(base);
};

const render = () => {
	requestAnimationFrame(render);
	walkers.forEach(w => w.render(context));
};

document.body.appendChild(canvas);
start();
render();

canvas.addEventListener('click', () => start());