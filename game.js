const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

const WORLD_WIDTH = 1200;
const WORLD_HEIGHT = 1000;

const CAMERA_WIDTH = 800;
const CAMERA_HEIGHT = 600;

const CAMERA_MIN_X = CAMERA_WIDTH / 2;
const CAMERA_MAX_X = WORLD_WIDTH - CAMERA_WIDTH / 2;
const CAMERA_MIN_Y = CAMERA_HEIGHT / 2;
const CAMERA_MAX_Y = WORLD_HEIGHT - CAMERA_HEIGHT / 2;

canvas.width = CAMERA_WIDTH;
canvas.height = CAMERA_HEIGHT;

document.body.appendChild(canvas);

const gravity = {
  x: 0,
  y: 1
};

const drag = {
  y: 0,
  x: 0.9
};

const KEYS = {
  UP: 38,
  DOWN: 40,
  LEFT: 37,
  RIGHT: 39
};

const pressed = {};

const isKeyPressed = (key) => {
  return pressed[key] === true;
};

window.addEventListener("keydown", (e) => {
  pressed[e.keyCode] = true;
});

window.addEventListener("keyup", (e) => {
  pressed[e.keyCode] = false;
});

const intersectAABB = (A, B) => {
  return !(
    A.pos.x - A.size.x / 2 >= B.pos.x + B.size.x / 2 ||
    A.pos.x + A.size.x / 2 <= B.pos.x - B.size.x / 2 ||
    A.pos.y - A.size.y / 2 >= B.pos.y + B.size.y / 2 ||
    A.pos.y + A.size.y / 2 <= B.pos.y - B.size.y / 2
  );
};

function rand(min, max = 0) {
  if (arguments.length < 2) {
    max = min;
    min = 0;
  }

  return Math.random() * (max - min) + min;
}

function randInt(min, max = 0) {
  if (arguments.length < 2) {
    max = min;
    min = 0;
  }

  return Math.floor(Math.random() * (max - min + 1)) + min;
}

let gameover = false;

let isLanded = 0;

const START_FUEL = 2000;
const MAX_FALL_SPEED = 15;

let score = 0;

class Body {
  get l() {
    return this.pos.x - this.size.x / 2;
  }

  get r() {
    return this.pos.x + this.size.x / 2;
  }

  get t() {
    return this.pos.y - this.size.y / 2;
  }

  get b() {
    return this.pos.y + this.size.y / 2;
  }
}

class Camera extends Body {
  constructor(x, y, w, h) {
    super();

    this.size = { x: w, y: h };
    this.pos = { x, y };
  }

  isXYinView(x, y, treshold) {
    return !(
      x < this.l + treshold ||
      x > this.r - treshold ||
      y < this.t + treshold ||
      y > this.b - treshold
    );
  }

  // butthurt
  // intersection(x4, y4) {
  //   let x1 = 0;
  //   let y1 = y4 < this.pos.y ? this.t : this.b;

  //   let x2 = WORLD_WIDTH;
  //   let y2 = y4 < this.pos.y ? this.t : this.b;

  //   let x3 = this.pos.x;
  //   let y3 = this.pos.y;

  //   let x =
  //     ((x2 * y1 - x1 * y2) * (x4 - x3) - (x4 * y3 - x3 * y4) * (x2 - x1)) /
  //       ((x2 - x1) * (y4 - y3) - (x4 - x3) * (y2 - y1)) -
  //     camera.l;

  //   let y =
  //     ((x2 * y1 - x1 * y2) * (y4 - y3) - (x4 * y3 - x3 * y4) * (y2 - y1)) /
  //       ((x2 - x1) * (y4 - y3) - (x4 - x3) * (y2 - y1)) -
  //     camera.t;

  //   console.log("");
  //   console.log(x1, y1, x2, y2);
  //   console.log(x3, y3, x4, y4);
  //   console.log(x, y);
  //   console.log(camera.l, camera.t);
  //   console.log("");

  //   return { x, y };
  // }
}

class Car extends Body {
  constructor(p) {
    super();

    this.size = { x: 40, y: 16 };
    this.pos = { x: p.pos.x, y: p.t - this.size.y / 2 };
    this.vel = { x: 0, y: 0 };
    this.acc = { x: 0, y: 0 };

    this.fuel = START_FUEL;
  }

  update(delta) {
    if (this.fuel > 0) {
      if (isKeyPressed(KEYS.UP)) {
        isLanded = 0;

        this.acc.y = -5;
        this.fuel -= 1;
      } else if (isKeyPressed(KEYS.DOWN)) {
        this.acc.y = 5;
        this.fuel -= 1;
      } else {
        this.acc.y = 0;
      }

      if (isKeyPressed(KEYS.LEFT)) {
        this.acc.x = -3;
        this.fuel -= 1;
      } else if (isKeyPressed(KEYS.RIGHT)) {
        this.acc.x = 3;
        this.fuel -= 1;
      } else {
        this.acc.x = 0;
      }
    }

    if (this.fuel === 0 && isLanded) {
      setTimeout(() => {
        gameover = true;
      }, 2000);
    }

    if (!isLanded) {
      this.vel.x += ((this.acc.x + gravity.x) * delta) / 1000;
      this.vel.x = this.vel.x * 0.99;

      this.vel.y += ((this.acc.y + gravity.y) * delta) / 1000;

      this.pos.x += this.vel.x;
      this.pos.y += this.vel.y;
    }

    if (this.l < 0) {
      gameover = true;
      this.pos.x = this.size.x / 2;
    }

    if (this.r > WORLD_WIDTH) {
      gameover = true;
      this.pos.x = WORLD_WIDTH - this.size.x / 2;
    }

    if (this.t < 0) {
      gameover = true;
      this.pos.y = this.size.y / 2;
    }

    if (this.b > WORLD_HEIGHT) {
      gameover = true;
      this.pos.y = WORLD_HEIGHT - this.size.y / 2;
    }

    let pass = passengers[currentPassenger];

    if (!isLanded && !pass.inCar && intersectAABB(this, pass)) {
      pass.reset();
      currentPassenger = (currentPassenger + 1) % passengers.length;
      passengers[currentPassenger].start();

      score -= 15;
    }

    if (this.fuel <= 0) {
      this.acc.y = 0;
      this.acc.x = 0;
    }

    if (this.pos.x < CAMERA_MIN_X) {
      camera.pos.x = CAMERA_MIN_X;
    } else if (this.pos.x > CAMERA_MAX_X) {
      camera.pos.x = CAMERA_MAX_X;
    } else {
      camera.pos.x = this.pos.x;
    }

    if (this.pos.y < CAMERA_MIN_Y) {
      camera.pos.y = CAMERA_MIN_Y;
    } else if (this.pos.y > CAMERA_MAX_Y) {
      camera.pos.y = CAMERA_MAX_Y;
    } else {
      camera.pos.y = this.pos.y;
    }
  }

  draw() {
    ctx.fillStyle = "#fff";
    ctx.fillRect(this.l, this.t, this.size.x, this.size.y);

    ctx.font = "bold 18px 'Arial', Arial";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.fillText(`F`, camera.r - 330, camera.b - 22);

    ctx.strokeStyle = "#fff";
    ctx.fillRect(
      camera.r - 315,
      camera.b - 30,
      300 * (this.fuel / START_FUEL),
      15
    );
  }
}

class Platform extends Body {
  constructor(x, y, w, h) {
    super();

    this.pos = { x, y };
    this.size = { x: w, y: h };
  }
}

const PASSENGER_MOVE_SPEED = 50 / 1000;

class Passenger extends Body {
  constructor({ from, to, wait, delay = 0 }) {
    super();

    this.from = from;
    this.to = to;
    this.wait = wait;
    this.delay = delay;

    this.color = "lime";

    this.size = {
      x: 12,
      y: 24
    };

    this.reset();
  }

  start() {
    if (this.delay) {
      setTimeout(() => {
        this.startTime = Date.now();
      }, this.delay * 1000);
    } else {
      this.startTime = Date.now();
    }
  }

  reset() {
    this.pos = {
      x: platforms[this.from].pos.x,
      y: platforms[this.from].t - this.size.y / 2
    };

    this.tip = 0;

    this.startTime = null;
    this.inCar = false;
    this.delivered = false;
    this.dead = false;
  }

  update(deltaTime) {
    if (this.inCar) {
      return;
    } else if (this.delivered) {
      const distanceToCar = Math.abs(car.pos.x - this.pos.x);

      if (distanceToCar > car.size.x) {
        this.reset();
        currentPassenger = (currentPassenger + 1) % passengers.length;
        passengers[currentPassenger].start();
      }

      const direction = Math.sign(car.pos.x - this.pos.x);
      const step = Math.min(PASSENGER_MOVE_SPEED * deltaTime, distanceToCar);

      this.pos.x += step * -direction;
    }
    if (this.startTime) {
      const distanceToCar = Math.abs(car.pos.x - this.pos.x);
      const distanceToPlatform = Math.abs(
        platforms[this.from].pos.x - this.pos.x
      );
      const direction = Math.sign(car.pos.x - this.pos.x);
      const step = Math.min(PASSENGER_MOVE_SPEED * deltaTime, distanceToCar);

      if (isLanded === this.from) {
        this.pos.x += step * direction;
      } else if (distanceToPlatform > 10) {
        this.pos.x += step * -direction;
      }

      if (this.pos.x === car.pos.x) {
        this.inCar = true;
      }
    }
  }

  highlightPlatform(pId, color) {
    const platform = platforms[pId];
    if (!camera.isXYinView(platform.pos.x, platform.pos.y, 0)) {
      const dx = (platform.pos.x - camera.pos.x) / 1000;
      const dy = (platform.pos.y - camera.pos.y) / 1000;

      let x;
      let y;

      for (var i = 0; i < 1000; i++) {
        let _x = camera.pos.x + dx * i;
        let _y = camera.pos.y + dy * i;

        if (camera.isXYinView(_x, _y, 70)) {
          x = _x;
          y = _y;
        } else {
          break;
        }
      }

      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.closePath();

      ctx.fillStyle = color;
      ctx.fill();
    }
  }

  draw() {
    if (this.inCar) {
      ctx.beginPath();
      ctx.arc(
        platforms[this.to].pos.x,
        platforms[this.to].t - 15,
        8,
        0,
        Math.PI * 2
      );
      ctx.closePath();

      ctx.fillStyle = "yellow";
      ctx.fill();

      ctx.fillStyle = "lime";
      ctx.fillRect(car.pos.x - 5, car.t - 5, 10, 10);

      this.highlightPlatform(this.to, "yellow");

      return;
    } else if (this.delivered) {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.l, this.t, this.size.x, this.size.y);
    } else if (this.startTime) {
      const timePassed = (Date.now() - this.startTime) / 1000;

      this.highlightPlatform(this.from, "lime");

      if (timePassed > this.wait) {
        this.reset();
        currentPassenger = (currentPassenger + 1) % passengers.length;
        passengers[currentPassenger].start();
      } else {
        this.tip = Math.ceil(this.wait - timePassed);

        ctx.fillStyle = "#ccc";
        ctx.font = "bold 20px Courier";
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillText(
          this.tip,
          platforms[this.from].pos.x,
          platforms[this.from].t - 15 - this.size.y
        );

        ctx.fillStyle = this.color;
        ctx.fillRect(this.l, this.t, this.size.x, this.size.y);
      }
    }
  }
}

Passenger.randomize = function() {
  const wait = randInt(8, 15);
  const delay = randInt(3, 8);
  const f = randInt(1, 6);
  let to = randInt(1, 6);
  while (to === f) {
    to = randInt(1, 6);
  }

  return new Passenger({
    from: f,
    to,
    wait,
    delay
  });
};

const camera = new Camera(
  CAMERA_MIN_X,
  CAMERA_MIN_Y,
  CAMERA_WIDTH,
  CAMERA_HEIGHT
);

const platforms = {
  1: new Platform(WORLD_WIDTH / 2, WORLD_HEIGHT - 130, 300, 20),
  2: new Platform(150, 150, 300, 20),
  3: new Platform(WORLD_WIDTH - 100, 250, 200, 20),
  4: new Platform(200, 700, 200, 20),
  5: new Platform(350, 550, 300, 20),
  6: new Platform(900, 600, 300, 20)
};

let currentPassenger = 0;
const passengers = new Array(15);
for (var i = 0; i < passengers.length; i++) {
  passengers[i] = Passenger.randomize();
}

// [
//   new Passenger({
//     from: 2,
//     to: 3,
//     wait: rand(8, 15),
//     delay: 1
//   }),
//   new Passenger({
//     delay: rand(3, 8),
//     from: 4,
//     to: 2,
//     wait: rand(8, 15)
//   }),
//   new Passenger({
//     delay: 4,
//     from: 6,
//     to: 2,
//     wait: rand(8, 15)
//   }),
//   new Passenger({
//     delay: rand(3, 8),
//     from: 5,
//     to: 2,
//     wait: rand(8, 15)
//   }),
//   new Passenger({
//     delay: rand(3, 8),
//     from: 3,
//     to: 6,
//     wait: rand(8, 15)
//   }),
//   new Passenger({
//     delay: rand(3, 8),
//     from: 1,
//     to: 3,
//     wait: rand(8, 15)
//   })
// ];

const car = new Car(platforms[1]);

let lastTime = Date.now();
const loop = () => {
  const pass = passengers[currentPassenger];
  const time = Date.now();
  const delta = time - lastTime;
  lastTime = time;

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  ctx.translate(-camera.l, -camera.t);

  ctx.fillStyle = "#111";
  for (var i = 0; i < Math.max(WORLD_WIDTH, WORLD_HEIGHT) / 50; i++) {
    ctx.fillRect(0, i * 50, WORLD_WIDTH, 2);
    ctx.fillRect(i * 50, 0, 2, WORLD_HEIGHT);
  }

  car.update(delta);

  ctx.font = "bold 300px 'Arial', Arial";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillStyle = "#222";
  ctx.fillText(`${score}`, WORLD_WIDTH / 2, WORLD_HEIGHT / 2);

  ctx.fillStyle = "#fff";

  ctx.fillStyle = "#999";
  for (let pId in platforms) {
    const p = platforms[pId];
    ctx.fillRect(
      p.pos.x - p.size.x / 2,
      p.pos.y - p.size.y / 2,
      p.size.x,
      p.size.y
    );

    if (!isLanded && intersectAABB(car, p)) {
      // can we land?
      if (
        car.pos.y < p.pos.y &&
        (car.vel.y * 1000) / 60 <= MAX_FALL_SPEED &&
        car.l >= p.l &&
        car.r <= p.r
      ) {
        // landed on platform
        isLanded = +pId;

        if (pass.inCar && pass.to === isLanded) {
          pass.inCar = false;
          pass.delivered = true;

          pass.pos.x = car.pos.x + 1;
          pass.pos.y = platforms[pass.to].t - pass.size.y / 2;

          score += 10 + pass.tip || 0;
        }

        car.pos.y = p.pos.y - car.size.y / 2 - p.size.y / 2;

        car.vel.y = 0;
        car.vel.x = 0;
      } else {
        gameover = true;
      }
    }
  }

  if (!gameover) {
    car.draw();
  }

  pass.update(delta);
  pass.draw();

  if (gameover) {
    ctx.font = "bold 80px 'Arial Black', Arial";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.fillText(`Game Over`, camera.pos.x, camera.pos.y);
  } else {
    requestAnimationFrame(loop);
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
};

loop();

passengers[currentPassenger].start();
