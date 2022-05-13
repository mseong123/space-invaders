var game;//global variable for game object

function Game() {
  this.canvas=document.getElementById("game");
  this.ctx=document.getElementById("game").getContext("2d");
  this.startButton=document.getElementById("start");
  this.restartButton=document.getElementById("restart");
  this.invaders=[];
  this.invaderLaser;
  this.ship;
  this.shipLaser;
  this.score=0;
  this.gameover;
  
  //CONFIGURABLE PROPERTIES
  this.font="Major Mono Display";
  this.fontSize=25;
  this.lives=3; //lives of ship
  this.colorScheme=["#192D2E","#617F7F","#EFD9A7"] //color codes - Background,invader,ship,others
  //positioning & movement of invaders & ship. ONLY change size(for invaders and ship),offset (invaders only) and canvasPadding properties,dx,laserspeed everything else is automatically calculated.
  this.canvasPadding=40;//for positioning of invader. Also boundary for invader and ship
  this.size=30;//size of ship and invaders
  this.offset=10;//offset for invaders only
  this.laserSpeed=5; //speed of ship laser. Speed of invader laser is 70% of ship laser
  //JS script for automatic adjustment of canvas size for responsiveness. Can't use CSS media rule due to aspect ratio and pixel scale distortion. 
  if(window.matchMedia("(min-width: 768px)").matches) {
    this.size=40;
    this.offset=15;
    this.canvasPadding=60;
    this.fontSize=35
  };
  this.dx=0.2;//control horizontal speed of invaders (0.2 best as default for requestAnimationFrame 60fps based on my testing); speed of ship control in Ship constructor function;
  this.dy=this.size/3;//control vertical speed of invader (based on size property above);
  this.row=Math.floor((this.canvas.height-this.canvasPadding-(0.4*this.canvas.height))/(this.size+this.offset));//auto calculation of number of invader rows based on canvas size,size of invaders and offset
  this.column=Math.floor((this.canvas.width-(2*this.canvasPadding))/(this.size+this.offset));//auto calculation same as above.
  
}

Game.prototype.init=function() {
  
  //initiate Start Page
  this.startPage();
  
  //initiate all invaders automatically based on canvas size
  this.initInvaders();
  //initiate ship
  this.initShip();
  //initiate ship laser
  this.shipLaser=new Laser(this.ctx,this.ship.x+0.5*this.ship.width,this.ship.y,this.laserSpeed,this.colorScheme[1]);
  //initiate first random invader laser
  var randomInvader= this.createRandomInvaderLaser();
  this.invaderLaser=new Laser(this.ctx,this.invaders[randomInvader].x+0.5*this.invaders[randomInvader].width,this.invaders[randomInvader].y+this.invaders[randomInvader].height,0.7*this.laserSpeed,this.colorScheme[1]);
  
  //EVENTLISTENERS
  //click event on start button to start game by executing Game.prototype.move() which will start drawing 
  this.startButton.addEventListener("click",()=>{
    this.move();
    this.startButton.style.display="none";
    this.restartButton.style.display="none";
    //control buttons only appear for mobile and tablets;
    if(!window.matchMedia("(min-width: 768px)").matches) {
      document.getElementById("left").style.display="inline-block";
      document.getElementById("right").style.display="inline-block";
    }
  });
  
  //click event on restart button (only appear upon gameover) which will create new Game object and init game;
  this.restartButton.addEventListener("click",()=>{
    game=new Game();
    game.init();
    game.restartButton.style.display="none";
    game.startButton.style.display="inline-block";
    
    
  });
  //set keydown & keyup eventlistener for arrow control
  this.canvas.addEventListener("keydown", (e)=>{
    this.controlShipKeyboard(e);
  });
  this.canvas.addEventListener("keyup", (e)=>{
    this.controlShipKeyboard(e);
  });
  //set touchstart and touchend eventlistener for touch control
  document.getElementById("left").addEventListener("touchstart", (e)=>{
    this.controlShipTouch(e);
  });
  document.getElementById("left").addEventListener("touchend", (e)=>{
    this.controlShipTouch(e);
  });
  document.getElementById("right").addEventListener("touchstart", (e)=>{
    this.controlShipTouch(e);
  });
  document.getElementById("right").addEventListener("touchend", (e)=>{
    this.controlShipTouch(e);
  });
}

Game.prototype.move=function() {
  var that=this;
  //shift focus back to canvas
  this.canvas.focus();
  //clear canvas
  this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
  //draw background;
  this.ctx.save()
  this.ctx.fillStyle=this.colorScheme[0];
  this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
  this.ctx.restore();
  //draw the rest
  this.displayScore();
  this.displayLives();
  this.moveInvaders();
  this.moveShip();
  this.moveShipLaser();
  this.moveInvaderLaser();
  
  
  if (!this.gameover) {
    this.raf=requestAnimationFrame(()=>{ 
      that.move(); 
    });
  }
  else {
    cancelAnimationFrame(this.raf);
    this.restartButton.style.display="inline-block";
  }
 };


Game.prototype.startPage = function() {
  //COVER SCREEN BEFORE GAME START
  //draw text
  this.ctx.save();
  this.ctx.fillStyle=this.colorScheme[0];
  this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
  this.ctx.fillStyle=this.colorScheme[1];
  this.ctx.font="bold "+ this.fontSize + "px " +this.font;
  this.ctx.textAlign="center";
  this.ctx.textBaseline="middle";
  this.ctx.fillText("space invaders",0.5*this.canvas.width,0.3*this.canvas.height)
  this.ctx.restore();
  
  //draw invaders
  new Invader(this.ctx,"A",this.size,0.25*this.canvas.width,0.4*this.canvas.height,this.colorScheme[1]).draw();
  new Invader(this.ctx,"B",this.size,0.4*this.canvas.width,0.4*this.canvas.height,this.colorScheme[2]).draw();
  new Invader(this.ctx,"C",this.size,0.55*this.canvas.width,0.4*this.canvas.height,this.colorScheme[1]).draw();
 new Invader(this.ctx,"D",this.size,0.7*this.canvas.width,0.4*this.canvas.height,this.colorScheme[2]).draw();
}

Game.prototype.displayScore = function() {
  this.ctx.save();
  this.ctx.textAlign="center";
  this.ctx.fillStyle=this.colorScheme[1];
  this.ctx.font="bold "+ (0.8*this.fontSize) + "px " +this.font;
  this.ctx.textAlign="center";
  this.ctx.textBaseline="middle";
  this.ctx.fillText("score: "+this.score,0.5*this.canvas.width,0.4*this.canvasPadding)
  this.ctx.restore();
}
Game.prototype.displayLives = function() {
  for (var i=this.lives-1;i>=1;i--) {
   var ship=new Ship(this.ctx,this.size/2,this.canvas.width-0.4*this.canvasPadding-(i*(this.size/2+0.3*this.canvasPadding)),0.25*this.canvasPadding,this.colorScheme[2])
   ship.appearAnimationFrame=ship.frame+1; //to override the blinking effect inherent in drawing of ship;
    
    ship.draw();
  }
}

//function to check if all invaders dead. Return true if all dead;
Game.prototype.checkAliveInvaders = function () {
  return this.invaders.every((array)=> !array.alive);
}

//Invader constructor functions and methods

//Invader constructor function to create diff size,offsets,starting position X,Y and types of invader OBJECTS with own draw() method
function Invader(ctx,type,size,x,y,colorScheme) {
  this.height=size;
  this.width=size;
  this.x=x;
  this.y=y;
  this.colorScheme=colorScheme;
  this.type=type;
  this.movingAnimationFrame=0;//counter to control additional movement of invader body parts per frame;
  this.frame=30;//number of frames for each animation
  this.alive=1; //if null, invader not drawn;
  this.explode; //variable to trigger explosion
  
  
  this.draw=function() {
    ctx.save();
    ctx.fillStyle=this.colorScheme;
    ctx.strokeStyle=this.colorScheme;
    //*all body parts scaled automatically and proportionately to width/height properties;
    //type A Invader
    if(this.type=="A" && this.alive) {
      //main body
   ctx.beginPath(); ctx.moveTo(this.x+0.4*this.width,this.y); ctx.lineTo(this.x+0.4*this.width,this.y+0.2*this.height);
   ctx.arcTo(this.x+0.2*this.width,this.y+0.2*this.height,this.x+0.2*this.width,this.y+0.4*this.height,0.2*this.width);
ctx.lineTo(this.x,this.y+0.4*this.height);
ctx.lineTo(this.x,this.y+0.6*this.height);
ctx.lineTo(this.x+0.3*this.width,this.y+0.6*this.height);
ctx.arcTo(this.x+0.3*this.width,this.y+this.height,this.x+0.4*this.width,this.y+this.height,this.width*0.2)
ctx.lineTo(this.x+0.6*this.width,this.y+this.height);
ctx.arcTo(this.x+0.7*this.width,this.y+this.height,this.x+0.7*this.width,this.y+0.6*this.height,this.width*0.2);
ctx.lineTo(this.x+0.7*this.width,this.y+0.6*this.height);
ctx.lineTo(this.x+this.width,this.y+0.6*this.height);
ctx.lineTo(this.x+this.width,this.y+0.4*this.height);
ctx.lineTo(this.x+0.8*this.width,this.y+0.4*this.height);
ctx.arcTo(this.x+0.8*this.width,this.y+0.2*this.height,this.x+0.6*this.width,this.y+0.2*this.height,this.width*0.2);
    
    ctx.lineTo(this.x+0.6*this.width,this.y);
    ctx.closePath();
    ctx.fill();
      
    //left fin
      ctx.save();
      ctx.lineCap="round";
      ctx.lineWidth="2";
    //for additional body part animation
    if (this.movingAnimationFrame<this.frame) {
      ctx.beginPath();
      ctx.moveTo(this.x+0.25*this.width,this.y+0.65*this.height);
      ctx.lineTo(this.x,this.y+this.height);
      ctx.stroke();
      this.movingAnimationFrame+=1;
      
      
    } else {
      ctx.beginPath();
      ctx.moveTo(this.x+0.25*this.width,this.y+0.65*this.height);
      ctx.lineTo(this.x+0.2*this.width,this.y+this.height);
      ctx.stroke();
      this.movingAnimationFrame+=1;
    }
    //right fin
    if (this.movingAnimationFrame<this.frame) {  
      ctx.beginPath();
      ctx.moveTo(this.x+0.75*this.width,this.y+0.65*this.height);
      ctx.lineTo(this.x+this.width,this.y+this.height);
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.moveTo(this.x+0.75*this.width,this.y+0.65*this.height);
      ctx.lineTo(this.x+0.8*this.width,this.y+this.height);
      ctx.stroke();
      
    }
      //reset counter
      if (this.movingAnimationFrame>this.frame*2) this.movingAnimationFrame=0;
      ctx.restore();
      
      //eyes
      ctx.save();
      ctx.fillStyle="white";
      ctx.beginPath(); ctx.arc(this.x+0.4*this.width,this.y+0.4*this.height,0.05*this.width,0,Math.PI*2); ctx.arc(this.x+0.6*this.width,this.y+0.4*this.height,0.05*this.width,0,Math.PI*2);
      ctx.fill();
      ctx.restore();
      }
    
    //type B Invader
    if(this.type=="B" && this.alive) {
      //main body
      ctx.beginPath();
      ctx.ellipse(this.x+this.width/2,this.y+0.4*this.height,this.width/2,this.width/4,0,0,Math.PI*2);
      ctx.fill();
      //antennas
      ctx.save();
      ctx.lineWidth="2";
      ctx.beginPath(); ctx.moveTo(this.x+0.5*this.width,this.y+0.5*this.height,);
      ctx.lineTo(this.x+0.2*this.width,this.y+0.05*this.height);
ctx.moveTo(this.x+0.5*this.width,this.y+0.5*this.height,);
      ctx.lineTo(this.x+0.8*this.width,this.y+0.05*this.height)
      ctx.stroke();
      ctx.restore();
      //legs
      //no additional animation for Type B body parts
      ctx.save();
      ctx.lineWidth="3";
      ctx.lineCap="round";
      ctx.beginPath();
ctx.moveTo(this.x+0.4*this.width,this.y+0.5*this.height,); ctx.lineTo(this.x+0.15*this.width,this.y+0.75*this.height);
ctx.moveTo(this.x+0.6*this.width,this.y+0.5*this.height,);
ctx.lineTo(this.x+0.85*this.width,this.y+0.75*this.height);
      ctx.stroke();
      ctx.restore();
      //eyes
      ctx.save();
      ctx.fillStyle="white";
      ctx.beginPath(); ctx.arc(this.x+0.35*this.width,this.y+0.35*this.height,0.05*this.width,0,Math.PI*2); ctx.arc(this.x+0.65*this.width,this.y+0.35*this.height,0.05*this.width,0,Math.PI*2);
      ctx.fill();
      ctx.restore();
    }
    
    //type C Invader
    if(this.type=="C" && this.alive) {
      //main body
      ctx.beginPath();
      ctx.ellipse(this.x+this.width/2,this.y+0.4*this.height,this.width/2,this.width/4,0,0,Math.PI*2);
      ctx.fill();
      //head
ctx.fillRect(this.x+0.4*this.width,this.y+0.1*this.height,0.2*this.width,0.2*this.height);
      //legs
      ctx.save();
      ctx.lineWidth="2";
      ctx.lineCap="round";
      //for additional body part animation
      if (this.movingAnimationFrame<this.frame) {
        ctx.beginPath();
        ctx.moveTo(this.x+0.5*this.width,this.y+0.6*this.height,);
        ctx.lineTo(this.x+0.05*this.width,this.y+0.75*this.height);
        ctx.moveTo(this.x+0.5*this.width,this.y+0.6*this.height,);
        ctx.lineTo(this.x+0.95*this.width,this.y+0.75*this.height);
        ctx.stroke();
        this.movingAnimationFrame+=1;
      } else {
        ctx.beginPath();
        ctx.moveTo(this.x+0.5*this.width,this.y+0.6*this.height,);
        ctx.lineTo(this.x+0.15*this.width,this.y+0.8*this.height);
        ctx.moveTo(this.x+0.5*this.width,this.y+0.6*this.height,);
        ctx.lineTo(this.x+0.85*this.width,this.y+0.8*this.height);
        ctx.stroke();
        this.movingAnimationFrame+=1;
      }
      //reset counter
      if (this.movingAnimationFrame>this.frame*2) this.movingAnimationFrame=0;
      ctx.restore();
    
    //eyes
      ctx.save();
      ctx.fillStyle="white";
      ctx.beginPath(); ctx.arc(this.x+0.35*this.width,this.y+0.35*this.height,0.05*this.width,0,Math.PI*2); ctx.arc(this.x+0.65*this.width,this.y+0.35*this.height,0.05*this.width,0,Math.PI*2);
      ctx.fill();
      ctx.restore();
  }
    
  //type D Invader
    if(this.type=="D" && this.alive) {
      //main body
      ctx.beginPath();
ctx.ellipse(this.x+this.width/2,this.y+0.4*this.height,this.width/2,this.width/4,0,0,Math.PI*2);
      ctx.fill();
      //head
ctx.fillRect(this.x+0.4*this.width,this.y+0.1*this.height,0.2*this.width,0.2*this.height);
      //legs
      ctx.save();
      ctx.lineWidth="3";
      ctx.lineCap="round";
      
      //for additional body part animation
      if (this.movingAnimationFrame<this.frame) {
        ctx.beginPath(); 
        ctx.moveTo(this.x+0.4*this.width,this.y+0.5*this.height,);
        ctx.lineTo(this.x+0.15*this.width,this.y+0.65*this.height);
        ctx.lineTo(this.x+0.3*this.width,this.y+0.8*this.height);
        ctx.moveTo(this.x+0.6*this.width,this.y+0.5*this.height,);
        ctx.lineTo(this.x+0.85*this.width,this.y+0.65*this.height);
        ctx.lineTo(this.x+0.7*this.width,this.y+0.8*this.height);
        ctx.stroke();
        this.movingAnimationFrame+=1;
      } else {
        ctx.beginPath(); 
        ctx.moveTo(this.x+0.4*this.width,this.y+0.5*this.height,);
        ctx.lineTo(this.x+0.15*this.width,this.y+0.7*this.height);
        ctx.lineTo(this.x+0.4*this.width,this.y+0.8*this.height);
        ctx.moveTo(this.x+0.6*this.width,this.y+0.5*this.height,);
        ctx.lineTo(this.x+0.85*this.width,this.y+0.7*this.height);
        ctx.lineTo(this.x+0.6*this.width,this.y+0.8*this.height);
        ctx.stroke();
        this.movingAnimationFrame+=1;
      }
      //reset counter
      if (this.movingAnimationFrame>this.frame*2) this.movingAnimationFrame=0;
      
      ctx.restore();
      //eyes
      ctx.save();
      ctx.fillStyle="white";
      ctx.beginPath(); ctx.arc(this.x+0.35*this.width,this.y+0.35*this.height,0.05*this.width,0,Math.PI*2); ctx.arc(this.x+0.65*this.width,this.y+0.35*this.height,0.05*this.width,0,Math.PI*2);
      ctx.fill();
      ctx.restore();
      
    }
    
    //animation for explosion for 10 frames
    if(this.explode) {
      ctx.save();
      ctx.beginPath();
      ctx.lineWidth="3";
      ctx.lineCap="round";
      ctx.translate(this.x+0.5*this.width,this.y+0.5*this.height);
      for (var i=0;i<12;i++) {
        ctx.save();
        ctx.rotate(i*Math.PI/6);
        ctx.moveTo(0.3*this.width,0);
        ctx.lineTo(0.6*this.width,0);
        ctx.restore();
      }
      ctx.stroke();
      ctx.restore();
      //below code for 10 frame explosion
      this.explode+=1;
      this.alive=null; //switch off alive first iteration so laser can pass through dead invaders immediately (when invaders are close to ship) even though animation for explosion still ongoing.
      if (this.explode>10) 
        this.explode=null;
      
    }
    ctx.restore();
  }
}

Game.prototype.moveInvaders=function() {
  var that=this; //for below callback function binding issues;
  var changeDirection;
  var speedUp;
  var collide;
  var currentDy=0;
  var currentDx=0;
  
  
  this.invaders.forEach((array)=>{
      array.draw();
    });
  
  //reiterate through each invader and check for 3 conditions:1) test if location of ANY ALIVE invaders breached side canvas boundaries, if so changeDirection=1; 2) If position of ANY invaders reached 60% of screen, if yes speedUp=1;  3) if Y position of ANY invaders collide with SHIP's Y position, if yes collide=1
  
  //*for media >768px once screen reach 70% then speedUp=2
  this.invaders.forEach((array)=>{
    if (array.alive) {
      //first condition
      if (array.x<that.canvasPadding ||array.x+that.size+that.offset>that.canvas.width-that.canvasPadding) {
        changeDirection=1;
      }
      if (array.y+array.height>0.6*that.canvas.height) 
        speedUp=1;
      
      if (array.y+array.height>0.7*that.canvas.height) 
        if(window.matchMedia("(min-width: 768px)").matches)
          speedUp=2;
         
      if (array.y+array.height>that.ship.y) 
        collide=1;
    }
  });
  
  //First condition resulting in change to invaders horizontal direction and moving vertically 1 step downwards
  if (changeDirection) {
    this.dx=-this.dx;
    currentDy=this.dy;
    }
  
  //Third condition if invader reaches line of ship, ship explodes and gameover
  if (collide) {
    this.ship.explode=1;
    this.gameover=1;
  }
 
  
  //Iterate through each invader object and update location;
  this.invaders.forEach((array)=> {
    //Second condition resulting in speed x 3 if invader reach 60% of canvas,speed x 6 if 70% of canvas
    !speedUp? array.x+=that.dx : speedUp===1? array.x+=that.dx*3: array.x+=that.dx*6
    
    array.y+=currentDy;
  });
  
  
  
  
  
}

Game.prototype.initInvaders=function() {
  
    //create new invaders
    //loop for row
    for (var i=0;i<this.row;i++) {
      //loop for column
      for (var j=0;j<this.column;j++) {
         i<1? 
           this.invaders.push(new Invader(this.ctx,"A",this.size,(j*(this.size+this.offset))+this.canvasPadding,(i*(this.size+this.offset))+this.canvasPadding,this.colorScheme[1]))
       : (i >=1 && i<2) ?
           this.invaders.push(new Invader(this.ctx,"B",this.size,(j*(this.size+this.offset))+this.canvasPadding,(i*(this.size+this.offset))+this.canvasPadding,this.colorScheme[1]))
        : (i>=2 && i<3) ?
            this.invaders.push(new Invader(this.ctx,"C",this.size,(j*(this.size+this.offset))+this.canvasPadding,(i*(this.size+this.offset))+this.canvasPadding,this.colorScheme[1]))
        :  
            this.invaders.push(new Invader(this.ctx,"D",this.size,(j*(this.size+this.offset))+this.canvasPadding,(i*(this.size+this.offset))+this.canvasPadding,this.colorScheme[1]))
      }
    }
  
  
 }


//Ship constructor functions and methods

function Ship(ctx,size,x,y,colorScheme) {
  this.height=size;
  this.width=1.5*size;
  this.x=x;
  this.y=y;
  this.alive=1;
  this.explode;
  this.indestructible;
  this.speed=3;//maximum speed of ship
  this.velX=0;
  this.friction=0.85;
  this.keyState=false;
  this.colorScheme=colorScheme;
  
  
  this.appearAnimationFrame=0;//counter to control blinking animation effect. Set to zero everytime when ship is reborned;
  this.frame=20;//interval of blinking animation effect
  
  this.draw=function() {
    //for movement easing
    if (this.keyState==="left") {
      if (this.velX>-this.speed)
      this.velX-=1;
    }
    if (this.keyState==="right") {
      if (this.velX<this.speed)
      this.velX+=1;
    }
    
    this.velX*=this.friction;
    
    this.x+=this.velX; 
    
    //MAIN BODY
    //Section below is for blinking animation effect when ship appears for first time or after reborn (where this.appearAnimationFrame counter is 0); During this period, ship is indestructible (Game.prototype.moveInvaderLaser function doesnt trigger this.explode to ship)
    ctx.save();
    ctx.fillStyle=this.colorScheme;
    ctx.strokeStyle=this.colorScheme;
    
    if (this.appearAnimationFrame<=this.frame*7 && !this.explode && this.alive) {
      this.indestructible=1; //switch on indestructible mode
      if (this.appearAnimationFrame<this.frame || (this.appearAnimationFrame>this.frame*2 && this.appearAnimationFrame<this.frame*3) || (this.appearAnimationFrame>this.frame*4 && this.appearAnimationFrame<this.frame*5)) {
        //When the above interval occurs, don't draw anything
        //increment counter
        this.appearAnimationFrame++;
      } else {
        //in between intervals, ship is drawn
          ctx.fillRect(this.x+0.45*this.width,this.y,0.1*this.width,0.25*this.height); ctx.fillRect(this.x+0.3*this.width,this.y+0.25*this.height,0.4*this.width,0.25*this.height);
          ctx.fillRect(this.x,this.y+0.5*this.height,this.width,0.5*this.height)
          //increment counter
          this.appearAnimationFrame++;
        }
      }
    //subsequently after initial blinking effect, the normal drawing takes place
    else {
     this.indestructible=null;//switch off indestructible;
      
     if (this.alive && !this.explode) {
      ctx.fillRect(this.x+0.45*this.width,this.y,0.1*this.width,0.25*this.height);
       ctx.fillRect(this.x+0.3*this.width,this.y+0.25*this.height,0.4*this.width,0.25*this.height);
      ctx.fillRect(this.x,this.y+0.5*this.height,this.width,0.5*this.height)
        }
      }
    ctx.restore();    
    
  //animation for explosion (same as invaders)
  if (this.explode) {
    ctx.save();
    ctx.beginPath();
    ctx.lineWidth="4";
    ctx.lineCap="round";
    ctx.translate(this.x+0.5*this.width,this.y+0.5*this.height);
    for (var i=0;i<12;i++) {
        ctx.save();
        ctx.rotate(i*Math.PI/6);
        ctx.moveTo(0.3*this.width,0);
        ctx.lineTo(0.6*this.width,0);
        ctx.restore();
      }
    ctx.stroke();
    ctx.restore();
    //below code for 10 frame explosion
      this.explode+=1;
      this.alive=null;
      if (this.explode>10) {
        this.explode=null;
        this.appearAnimationFrame=0;//reset to zero for animation blink;
        
        
      }
    }
  }
}

Game.prototype.moveShip=function() {
  //keeping ship within canvas boundary
  if (this.ship.x<this.canvasPadding) 
    this.ship.x=this.canvasPadding;
  if (this.ship.x>this.canvas.width-this.canvasPadding-this.ship.width) {
    this.ship.x=this.canvas.width-this.canvasPadding-this.ship.width;
  }
    
  this.ship.draw();
  
  //if there's still live in game, reactivate ship. 
  if (!this.ship.alive && this.lives) 
    this.ship.alive=1;
  //if nomore lives, gameover
  if (!this.lives)
    this.gameover=1;

}

Game.prototype.initShip=function() {
  
  this.ship=new Ship(this.ctx,this.size,this.canvas.width/2-(0.75*this.size),this.canvas.height-(2*this.size),this.colorScheme[2]);
  /*
  this.ship.appearAnimationFrame=1000;
  this.ship.draw();
  */
}

Game.prototype.controlShipKeyboard=function(e) {
  
  switch (e.which) {
    case 37:
      e.type=="keydown"? this.ship.keyState="left" : this.ship.keyState=false
    break;
    case 39:
      e.type=="keydown"? this.ship.keyState="right": this.ship.keyState=false
    break;
  }
  
}
Game.prototype.controlShipTouch=function(e) {
  e.preventDefault();
  if(e.target==document.getElementById("left"))
     e.type=="touchstart"? this.ship.keyState="left" : this.ship.keyState=false
    
  if(e.target==document.getElementById("right"))
     e.type=="touchstart"? this.ship.keyState="right" : this.ship.keyState=false
}

//Laser constructor functions (reusable by invader and ship) and methods
//*reason to have laser instance is so that can store coordinates for use.

function Laser(ctx,x,y,laserSpeed,colorScheme) {
  this.x=x;
  this.y=y;
  this.laserLength=10;
  this.ctx=ctx;
  this.laserSpeed=laserSpeed;
  this.colorScheme=colorScheme;
  
  this.draw=function() {
    ctx.save();
    ctx.lineWidth="3";
    ctx.strokeStyle=this.colorScheme;
    ctx.moveTo(this.x,this.y)
    ctx.lineTo(this.x,this.y+this.laserLength)
    ctx.stroke();
    ctx.restore()
  }
}

Game.prototype.moveShipLaser=function() {
  var that=this;
  //Location of ship
  var x=this.ship.x+0.5*this.ship.width;
  var y=this.ship.y;
  
  if(this.ship.alive) this.shipLaser.draw();
  this.shipLaser.y-=this.shipLaser.laserSpeed;
  //check for invaders hit
  this.invaders.forEach((array)=>{
    if(array.alive && that.ship.alive) {
      if(that.shipLaser.x>array.x && that.shipLaser.x<(array.x+array.width) && that.shipLaser.y<array.y+array.height) {
        that.shipLaser.x=x;
        that.shipLaser.y=y;
        that.score+=5;
        array.explode=1;
      }
    }
  })
  
  //reset laser when hit end of screen
  if(this.shipLaser.y===0) {
    that.shipLaser.x=x;
    that.shipLaser.y=y;
  }
}

Game.prototype.createRandomInvaderLaser=function() {
  
  var random=Math.floor(Math.random()*(this.invaders.length))
  //below check for any invaders left before entering while loop to ensure browser don't freeze
  
  if(this.checkAliveInvaders()) 
    
    return; 
    
  
  //loop if random number belongs to dead invader, calculate random number again.
  while(!this.invaders[random].alive) {
    random=Math.floor(Math.random()*(this.invaders.length));
  }
  return random;
}

Game.prototype.moveInvaderLaser=function() {
  
  
  this.invaderLaser.draw();
  this.invaderLaser.y+=this.invaderLaser.laserSpeed;
  //check for ship hit
  if(this.ship.alive && !this.ship.indestructible) {
    if(this.invaderLaser.x>this.ship.x && this.invaderLaser.x<(this.ship.x+this.ship.width) && this.invaderLaser.y>this.ship.y) {
    var randomInvader= this.createRandomInvaderLaser();
  this.invaderLaser.x=this.invaders[randomInvader].x+0.5*this.invaders[randomInvader].width;
  this.invaderLaser.y=this.invaders[randomInvader].y+this.invaders[randomInvader].height;
  this.ship.explode=1;
  this.lives-=1;
      }
  }

  //reset laser when hit end of screen
  if(this.invaderLaser.y>this.canvas.height) {
   var randomInvader=this.createRandomInvaderLaser();
    this.invaderLaser.x=this.invaders[randomInvader].x+0.5*this.invaders[randomInvader].width;
    this.invaderLaser.y=this.invaders[randomInvader].y+this.invaders[randomInvader].height;
  }
}



//TO FIT SOMEWHERE ELSE
if(window.matchMedia("(min-width: 768px)").matches) {
  document.getElementById("game").width="600";
  document.getElementById("game").height="500";
}


window.onload=()=> {
  game=new Game();
  game.init();
}









