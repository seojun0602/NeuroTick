/**
  * Author: seojun0602
  * NeuroTick. 2025. 07. 26.
*/

function Node(name){
  this.name = name;
  this.state = 0; // 0: 휴지, 1: 자극, 2: 탈분극, 3: 재분극
  
  // 이온 농도
  this.Na_in = 15; // 나트륨 아온(세포 내부)
  this.Na_out = 145; // 나트륨 이온(세포 외부)
  this.K_in = 140; // 칼륨 이온(세포 내부)
  this.K_out = 5; // 칼륨 이온(세포 와부)
  this.proteinAnions = -100; // 음이온 단백질(세포 내부)

  // 채널 열림 유무
  this.K_open = false; // 칼륨 채널
  this.Na_open = false; // 나트륨 채널
  
  // 연결된 node에 관해..
  this.next = null;
  this.distance = 1; // 거리(mm)
  this.velocity = 0.5; // 속도(mm/ms)
  
  this._queue = [];
}

Node.prototype.calc = function() {
  
 /** 초기값 
   * 내부: 15 + 140 + (-100) = 55
   * 외부: 145 + 5 = 150 
   * 차: 55 - 150 = -95
   * 이를 휴지 전위(-70mV)라고 본다면 
   * 비례 상수 * -95 = -70mV
   * 비례 상수 = -70/-95
   */

  let charge_in = this.Na_in + this.K_in + this.proteinAnions; // 세포 내부
  let charge_out = this.Na_out + this.K_out; // 세포 외부
  let scale = (-70)/(-95); // 비례 상수.
  return ((charge_in - charge_out) * scale);
}

/* tick. 1ms마다 실행되는 동작으로 보면 됨. */
Node.prototype.tick = function() {
  // Na/K 펌프
  this.Na_in -= 3;
  this.Na_out += 3;
  this.K_in += 2;
  this.K_out -= 2;
  
  if (this.state == 1) {
    this.Na_open = true;
  }

  // 나트륨 채널
  if (this.Na_open) {
    this.Na_in += 10;
    this.Na_out -= 10;
  }

  // 칼륨 채널
  if (this.K_open) {
    this.K_in -= 7;
    this.K_out += 7;
  }

  this.voltage = this.calc(); // 내부와 외부의 차, 즉 내부 > 외부라면 +, 반대라면 -..

/* 필자는 분극에 대해서 간단하게 이해하기 위해,
 * 내부는 -, 외부는 + 로 대전된 상태로 정의함.
 * 탈분극 상태는 그 반대로, 내부는 +, 외부는 - 로 대전된 상태로 간주함.
*/

  if (this.state == 1 && this.voltage > -55) {
    // 전위차가 - 이므로 내부 < 외부. 내부: -, 외부: + 로 대전된 상태. => (분극 상태 -> 탈분극)
    this.state = 2; // 탈분극
    this.Na_open = true;
  }
  
    if (this.state == 2) {
    // 탈분극 시 다음 노드로 자극 전달.
    this.propagate();
  }

  if (this.state == 2 && this.voltage > 30) {
    // 전위차가 + 이므로 내부 > 외부. 내부: +, 외부: - 로 대전된 상태. => (탈분극 -> 재분극)
    this.Na_open = false;
    this.K_open = true;
    this.state = 3; // 재분극
  }

  if (this.state == 3 && this.voltage <= -70) {
    // 전위차가 다시 -70mV 이하로 내려감. 과분극 상태 도달 -> 휴지 상태로 복귀.
    this.K_open = false;
    this.state = 0; // 휴지(분극)
  }
  
 this.handle();
};

// 자극
Node.prototype.stimulate = function() {
  (this.state == 0) && (this.state = 1);
};

// 전달
Node.prototype.propagate = function() {
  if (this.next && this.next.state == 0) {
    let delay = Math.ceil(this.distance / this.velocity);
    this._queue.push({ target: this.next, delay: delay });
  }
};

Node.prototype.handle = function() {
  this._queue = this._queue.filter(stim => {
    stim.delay--;
    if (stim.delay <= 0) {
      stim.target.stimulate();
      return false;
    }
    return true;
  });
};

Node.prototype.log = function() {
  console.log(`[${this.name}] state=${this.state}, voltage=${this.voltage.toFixed(2)}`);
};

/* example */

let a = new Node("A"); // A라는 이름의 node
let b = new Node("B"); // B...
let c = new Node("C"); // C...

a.next = b; // a 다음 b..
b.next = c; // b 다음 c..

b.stimulate(); // b 에 자극을..

// 20 틱 실행. (0~19)
for (let t = 0; t < 20; t++) {
  console.log(`\nTick ${t}`);
  a.tick(); b.tick(); c.tick();
  a.log(); b.log(); c.log();
}
