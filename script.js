$(function() {
    FastClick.attach(document.body);
    let app = GameOf2048();
    console.log('游戏开始，应用实例：', app);
});

// 构造函数
function GameOf2048(options) {
    // 可直接调用构造函数
    if(this instanceof GameOf2048){
        this.grid = []; // 二维数组，保存对应网格对应的状态（分数）
        this.score = 0; // 当前分数

        // _$$表示内部变量
        this._$$nums_dom =  null; // 指向方块包裹块
        this._$$score_dom = null; // 实现
        this._$$isInit =  true; // 是否初始化
        this._$$hisCell = 0; // 历史最大值
        this._$$hisScore = 0; // 历史最高分

        let defaultOptions = {
            DELAY_TIME: 210, // 动画延迟时间
            NUM: 4, // 方块数量，此属性为可扩展到更大的grid而预留
            BGCOLOR: { // 保存所有背景色
                2: "#eee4da",
                4: "#ede0c8",
                8: "#f2b179",
                16: "#f59563",
                32: "#f67c5f",
                64: "#f65e3b",
                128: "#edcf72",
                256: "#edcc61",
                512: "#9c0",
                1024: "#33b5e5",
                2048: "#09c",
                4096: "#a6c",
                8192: "#93c",
            }
        }
        this.conf = Object.assign(defaultOptions, options);
    }else{
        let _self = new GameOf2048();
        _self.init(); // 若直接调用构造函数，则自动初始化
        return _self;
    }
}

// util 辅助工具类：辅助函数、变量
GameOf2048.prototype = {
    getColorByNum(num){ // 根据数字大小获取字体颜色
        return num <= 4 ? "#776e65" : "#fff";
    },
    getBgColorByNum(num){ // 根据数字大小获取背景色
        return this.conf.BGCOLOR[num];
    },
    hasSpace(){ // 是否还有空方块
        for(let i = 0 ; i < this.conf.NUM ; i ++ )
            for(let j = 0 ; j < this.conf.NUM ; j ++ )
                if( this.grid[i][j] == 0 )
                    return true;
        return false;
    },
    // 是否能够向*方向移动
    canMoveLeft(){
        for(let i = 0 ; i < this.conf.NUM ; i ++ )
            for(let j = 1; j < this.conf.NUM ; j ++ )
                if( this.grid[i][j] != 0 )
                    if( this.grid[i][j-1] == 0 || this.grid[i][j-1] == this.grid[i][j] )
                        return true;

        return false;
    },
    canMoveRight(){
        for(let i = 0 ; i < this.conf.NUM ; i ++ )
            for(let j = this.conf.NUM - 2; j >= 0 ; j -- )
                if( this.grid[i][j] != 0 )
                    if( this.grid[i][j+1] == 0 || this.grid[i][j+1] == this.grid[i][j] )
                        return true;

        return false;
    },
    canMoveUp(){
        for(let j = 0 ; j < this.conf.NUM ; j ++ )
            for(let i = 1 ; i < this.conf.NUM ; i ++ )
                if( this.grid[i][j] != 0 )
                    if( this.grid[i-1][j] == 0 || this.grid[i-1][j] == this.grid[i][j] )
                        return true;

        return false;
    },
    canMoveDown(){
        for(let j = 0 ; j < this.conf.NUM ; j ++ )
            for(let i = this.conf.NUM - 2 ; i >= 0 ; i -- )
                if( this.grid[i][j] != 0 )
                    if( this.grid[i+1][j] == 0 || this.grid[i+1][j] == this.grid[i][j] )
                        return true;

        return false;
    },
    canMove(){
        if( this.canMoveLeft() ||
            this.canMoveRight() ||
            this.canMoveUp() ||
            this.canMoveDown() )
            return true;

        return false;
    },
    // 计算前一个方块与当前方块的关系，
    // crt是坐标组, dir表示方向
    calcCell(crt, dir){
        let crtCell = this.grid[crt[0]][crt[1]];

        let i, j; // 找到第一个不为0的“前方块”
        switch (dir) {
            case 'left':
                i = crt[0];
                j = crt[1] + 1;
                while(j < 3){
                    if(this.grid[i][j] != 0) break;
                    else j++;
                }
                break;
            case 'right':
                i = crt[0];
                j = crt[1] - 1;
                while(j > 0){
                    if(this.grid[i][j] != 0) break;
                    else j--;
                }
                break;
            case 'up':
                i = crt[0] + 1;
                j = crt[1];
                while(i < 3){
                    if(this.grid[i][j] != 0) break;
                    else i++;
                }
                break;
            case 'down':
                i = crt[0] - 1;
                j = crt[1];
                while(i > 0){
                    if(this.grid[i][j] != 0) break;
                    else i--;
                }
                break;
            default:
                break;
        }
        // 防止递归时下标越界,并且找到的数不为0
        if(i >= 0 && i < this.conf.NUM && j >= 0 && j < this.conf.NUM && this.grid[i][j] != 0){
            if(crtCell != 0 && crtCell == this.grid[i][j]){
                this.grid[crt[0]][crt[1]] = 2*crtCell;
                this.score += this.grid[crt[0]][crt[1]];
                this.grid[i][j] = 0;
                this.calcCell([i,j], dir) // 继续递归寻找已经空出位置应该填充的数组
                this.renderMove(i , j , crt[0], crt[1]);

            }else if(crtCell == 0 && this.grid[i][j] != 0){
                this.grid[crt[0]][crt[1]] = this.grid[i][j];
                this.grid[i][j] = 0;
                this.calcCell(crt, dir) // 继续递归寻找已经空出位置应该填充的数组
                this.renderMove(i , j , crt[0], crt[1]);
            }
        }
    },
    // 将整个grid向*方向移动，同时计算方块移动的关系和结果
    moveLeft(){
        if( !this.canMoveLeft() )
            return false;

        for(let i = 0; i < this.conf.NUM; i++)
            for(let j = 0; j < 3; j++)
                this.calcCell([i,j], 'left');

        this.updateView();
        return true;
    },
    moveRight(){
        if( !this.canMoveRight() )
            return false;

        for(let i = 0 ; i < this.conf.NUM ; i++)
            for(let j = 3 ; j > 0 ; j--)
                this.calcCell([i,j], 'right');

        this.updateView();
        return true;
    },
    moveUp(){
        if( !this.canMoveUp() )
            return false;

        for(let i = 0 ; i < 3 ; i++)
            for(let j = 0 ; j < this.conf.NUM ; j++)
                this.calcCell([i,j], 'up');


        this.updateView();
        return true;
    },
    moveDown(){
        if( !this.canMoveDown() ) return false;

        for(let i = 3 ; i > 0 ; i--)
            for(let j = 0 ; j < this.conf.NUM ; j++)
                this.calcCell([i,j], 'down');

        this.updateView();
        return true;
    },
    // 随机生成数字
    randomNum(){
        if( !this.hasSpace() ) return false;

        let crtSpace = []; // 存储当前有空的位置
        for(let i = 0 ; i < this.conf.NUM ; i ++ )
            for(let j = 0 ; j < this.conf.NUM ; j ++ ){
                if( this.grid[i][j] == 0 ){
                    crtSpace.push([i,j])
                }
            }


        let num = Math.random() < 0.5 ? 2 : 4, //随机一个数字
            idxi = parseInt(Math.floor(Math.random() * crtSpace.length)), //随机一个位置
            i = crtSpace[idxi][0],
            j = crtSpace[idxi][1];

        //在随机位置显示随机数字
        this.grid[i][j] = num;
        this.renderNum( i , j , num );

        // 当近有1个空位时，需要判断添加新的随机数后是否GG
        if(crtSpace.length == 1){
            this.isGG();
            return false;
        }

        return true;
    },
     // 渲染数字到DOM中
    renderNum(i , j , num, cell){
        cell = cell || $('#cell-num-' + i + "-" + j );
        cell.css({
            'background-color': this.getBgColorByNum( num ),
            'color': this.getColorByNum( num ),
            'font-size': (num>999 ? .5 : num>99 ? .9 : 1)+'rem',
        });
        cell.text( num );
    },
     // 渲染操作结果、即显示移动的动画
    renderMove(fromx , fromy , tox, toy){
        let cell = $('#cell-num-' + fromx + '-' + fromy ),
            to = $('#cell-num-' + tox + '-' + toy),
            x = to[0].offsetLeft - cell[0].offsetLeft,
            y = to[0].offsetTop - cell[0].offsetTop;

        cell.css({
            'transform': 'translate3d('+x+'px, '+y+'px, 0)'
        });
    },
     // 渲染分数分到DOM中，同时记录最高分和历史最高方块
    renderScore(){
        if(this.score > this._$$hisScore){
            this._$$hisScore = this.score;
        }
        this._$$score_dom.find('.js-score').text(this.score);
        this._$$score_dom.find('.js-his-score').text(this._$$hisScore);
        this._$$score_dom.find('.js-his-cell').text(this._$$hisCell);
    },
    isGG(){
        if( !this.hasSpace() && !this.canMove() ){
            let hisCellMesg = this._$$hisCell > localStorage.getItem('_$$hisCell') ? '，打破历史最大方块值':'';
            let hisScoreMesg = this._$$hisScore > localStorage.getItem('_$$hisScore') ? '，打破历史最高分':'';

            let msg =
            `<div class="mask" id="notice-msg">
                <p>游戏结束，最后得分：${this.score} ${hisCellMesg}  ${hisScoreMesg}</p>
            </div>`;

            $('body').append(msg);

            localStorage.setItem('_$$hisCell', this._$$hisCell); // 历史最大值
            localStorage.setItem('_$$hisScore', this._$$hisScore); // 历史最高分
        }
    },
    updateView(){  // 根据状态更新视图
        let _self = this;
        // 若是初始化，则直接更新视图，无需延时操作
        if(this._$$isInit){
            // 随机两个方块
            this.randomNum();
            this.randomNum();

            _$$fun();
        }else{
            setTimeout( _$$fun, this.conf.DELAY_TIME);
        }

        function _$$fun() {
            _self._$$nums_dom.html('');; // 移除所有数字方块

            for(let i = 0 ; i < _self.conf.NUM ; i ++ )
                for(let j = 0 ; j < _self.conf.NUM ; j ++ ){
                    _self._$$nums_dom.append('<div class="cell-num" id="cell-num-'+i+'-'+j+'"></div>');
                    let crtNum = _self.grid[i][j];
                    if( crtNum > 0 ){
                        _self.renderNum(i , j , crtNum, $('#cell-num-'+i+'-'+j));

                        // 保存历史最高方块
                        if(crtNum > _self._$$hisCell){
                            _self._$$hisCell = crtNum;
                        }
                    }
                }

            // 若不是初始化则需要生成新数字、然后判断是否GG
            if(!_self._$$isInit){
                // 生成新数字
                setTimeout(() => {
                    _self.randomNum();
                }, _self.conf.DELAY_TIME);
            }

            _self.renderScore();
        }
    },
    init() { // 初始化
        if(this._$$isInit){ // 点击“重新开始”按钮时，其实已经初始化背景并绑定事件了
            let html = '<div class="cell-nums" id="num-wrap"></div>';
            // 初始化每一个方块的分数，是否碰撞
            for(let i = 0 ; i < this.conf.NUM ; i ++ ){
                this.grid[i] = [];
                for(let j = 0 ; j < this.conf.NUM ; j ++ ){
                    this.grid[i][j] = 0;
                    html += '<div class="cell"></div>'
                }
            }

            $('#container').html(html); // 初始化背景

            this._$$nums_dom = $('#num-wrap'); // 用于保存数字方块部分
            this._$$score_dom = $('#score');

            // 从localStorage获取历史成绩
            this._$$hisCell = localStorage.getItem('_$$hisCell') || 0; // 历史最大值
            this._$$hisScore = localStorage.getItem('_$$hisScore') || 0; // 历史最高分

            //////////////////////////////////////////////////////
            // 事件绑定
            let _self = this;
            $('#newgame-btn').on('click', function () {
                _self.init();
            });

            // Web端键盘事件
            $(document).on('keydown', function( event ){
                switch( event.keyCode ){
                    case 37:
                    _self.moveLeft();
                        break;
                    case 38:
                    _self.moveUp();
                        break;
                    case 39:
                    _self.moveRight();
                        break;
                    case 40:
                    _self.moveDown();
                        break;
                    default:
                        break;
                }
            });

            // 移动端滑动事件
            let startx = 0, // 起点坐标
                starty = 0,
                endx = 0, // 终点坐标
                endy = 0;
            const DOCWIDTH =  window.screen.availWidth; // 页面屏幕宽度

            $(document).on('touchstart', function (event) {
                startx = event.touches[0].pageX;
                starty = event.touches[0].pageY;
            })
            .on('touchend', function(event){
                let endx = event.changedTouches[0].pageX,
                    endy = event.changedTouches[0].pageY;
                    deltax = endx - startx,
                    deltay = endy - starty,
                    deltax_abs = Math.abs( deltax ),
                    deltay_abs = Math.abs( deltay );
                // 滑动距离过短则直接返回
                if(deltax_abs < 0.3* DOCWIDTH && deltay_abs < 0.3* DOCWIDTH)
                    return;
                // 判断滑动方向
                if(deltax_abs >= deltay_abs){
                    deltax > 0 ? _self.moveRight() : _self.moveLeft();
                }else{
                    deltay > 0 ? _self.moveDown() : _self.moveUp();
                }
            });

        }else{
            $('#notice-msg').remove();
            this._$$nums_dom.html('');
            this.score = 0; // 初始化总分
            // 将grid还原
            for(let i = 0 ; i < this.conf.NUM ; i ++ ){
                this.grid[i] = [];
                for(let j = 0 ; j < this.conf.NUM ; j ++ ){
                    this.grid[i][j] = 0;
                }
            }
            this._$$isInit = true; // 此处手动从新设置初始化标识，但无需初始化背景和事件绑定
        }

        // 更新视图
        this.updateView();
        this._$$isInit = false;
    },
};