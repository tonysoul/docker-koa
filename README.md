## 什么是Docker
Docker 是一个开源的应用容器引擎，基于 Go 语言 并遵从 Apache2.0 协议开源。

Docker 可以让开发者打包他们的应用以及依赖包到一个轻量级、可移植的容器中，然后发布到任何流行的 Linux 机器上，也可以实现虚拟化。

容器是完全使用沙箱机制，相互之间不会有任何接口（类似 iPhone 的 app）,更重要的是容器性能开销极低。

## 为什么要用Docker
为了线下线上环境一致，更方便的部署

大家一定经历过环境配置的折磨
>“明明在我这台机器上都可以运行，为什么跑你那去就出错了？”

很大的可能环境不一致，如果线下更新了环境，那么服务器上也要更新一大堆。

为了减少这些痛苦，Dokcer提供了很好的解决方案：打包我们的应用以及依赖到Docker容器中，从而避免了环境不一致

## Docker的一些概念
- 镜像（Image）：Docker 镜像（Image），就相当于是一个 root 文件系统。比如官方镜像 ubuntu:16.04 就包含了完整的一套 Ubuntu16.04 最小系统的 root 文件系统。
- 容器（Container）：镜像（Image）和容器（Container）的关系，就像是面向对象程序设计中的类和实例一样，镜像是静态的定义，容器是镜像运行时的实体。容器可以被创建、启动、停止、删除、暂停等。
- 仓库（Repository）：仓库可看着一个代码控制中心，用来保存镜像。

## 安装Docker
[Docker安装](https://docs.docker.com/install/)

支持的平台：

DESKTOP
- Docker Desktop for Mac (macOS)	
- Docker Desktop for Windows (Microsoft Windows 10)

SERVER
- CentOS 
- Debian	 
- Fedora		 
- Ubuntu


## Docker仓库
[Docker仓库](hub.docker.com)

我们搭建环境使用的镜像都可以在上面的仓库找到

## 在开发过程中如何使用Docker

接下来我们就使用一个最简单的实例搭建一个基于koa的开发环境

## 开发环境使用的配置

### Node
- node:12-alpine
- koa 基础框架
- koa-router 路由
- promise-mysql mysql
- nodemon 自动重启服务

### Nginx
- nginx:1.17

### Mysql
- mysql:5.6

## 目录结构
```
- koa-docker
    - conf
    - data
    - docker-compose.yml
    - node_modules
    - package.json
    - server.js
    - static
    - yarn.lock
```

## 1.Node环境配置
要先安装好本地的node环境，新建一个项目

所有操作命令都在项目根目录中进行

> 本地环境为Linux Mint，和Win平台的某些命令不一致，可以适当修改

```
mkdir koa-docker
cd koa-docker
```

### 初始化项目
```
# 进入根目录执行cmd命令，生成package.json
npm init -y

# 修改npm启动脚本package.json
{
    "scripts":{
        "start":"nodemon server.js"
    }
}
```

### 安装node包
包管理工具yarn，或者npm，cnpm，随意
```
yarn add koa koa-router promise-mysql nodemon
```

### server服务
```
# server.js
const Koa = require('koa')
const Router = require('koa-router')
const mysql = require('promise-mysql')

let app = new Koa()
let router = new Router()

// 根路由
router.get('/', async ctx=>{
	ctx.body = 'index'
})

// 测试mysql连接路由
router.get('/db', async ctx=>{
	let db = await mysql.createPool({
		host: 'mysql',
		port: 3306,
		user: 'root',
		password: '123456'
	})
	let res = await db.query('SHOW DATABASES')
	ctx.body = res
})

app.use(router.routes())
app.listen(3000)

```

### [docker-compose](https://www.runoob.com/docker/docker-compose.html)
Compose 是用于定义和运行多容器 Docker 应用程序的工具。通过 Compose，您可以使用 YML 文件来配置应用程序需要的所有服务。然后，使用一个命令，就可以从 YML 文件配置中创建并启动所有服务。

### 配置docker-compose
如果我们只需要一个容器，可以用Dockerfile进行单独配置，（当然每个容器都可以写一个[Dockerfile](https://www.runoob.com/docker/docker-dockerfile.html)，然后docker-compose来build）

现在我们有多个容器需要管理


### docker-compose.yml
根目录新建docker-compose.yml文件

我们一步一步构建服务
```
version: "3"
services:
        web:
                image: node:12-alpine   #node镜像名称
                working_dir: /code      #工作目录
                volumes:                #挂载点
                        - .:/code       #把本地当前目录挂载到容器的/code目录
                ports:                  #端口映射
                        - "3000:3000"   #本地端口：容器端口
                command: npm start      #这条命令会在工作目录下执行

```
**关于volumes挂载点：**

由于容器删除了数据也会删除，我们把容器里的目录挂载到本地目录，容器挂载了的目录有任何改变，都会保存到本地

我们现在只有一个web服务，先跑起来看看能否正确运行
```
docker-compose up
```
如果你访问`localhost:3000`能够显示内容，说明容器正常运行起来了



## 2.Mysql配置

接着上面的配置，我们再添加一个mysql的配置
```
# docker-compose.yml
version: "3"
services:
        ...
        mysql:
                image: mysql:5.6
                volumes:
                        - ./data:/var/lib/mysql     #挂载当前的data目录到容器默认mysql存储目录
                environment:                        #环境变量
                        - MYSQL_ROOT_PASSWORD=123456    #mysql的root密码
                        - MYSQL_DATABASE=koa_docker     #mysql的初始化数据库
                ports:
                        - "3306:3306"               
```
我们现在有2个服务，web和mysql，一次同时运行两个服务
```
docker-compose up
```
不出意外，服务跑起来了，我们测试一下mysql是否能正常连接，访问`localhost:3000/db`，如果能够看到以下信息，说明mysql也正常连接了
```
[{"Database":"information_schema"},{"Database":"koa_docker"},{"Database":"mysql"},{"Database":"performance_schema"}]
```

## 3.Nginx配置
我们需要nginx的默认配置文件，先把一个nginx容器跑起来，复制容器里面的配置

### 运行一个nginx容器
```
docker run -itd --rm nginx:1.17
# -i 交互式操作 
# -t 终端
# -d 后台运行
# --rm 容器停止后自动销毁

我们会得到一个容器ID
35c5c3671780

也可以用docker ps查看运行的容器
```

### 复制容器里面的文件
```
# 复制nginx容器里的配置文件到当前目录
docker cp 35c5c3671780:/etc/nginx/conf.d/default.conf .
```

### default.conf配置文件
```
server {
    listen       80;
    server_name  localhost;

    location /static {
        alias /code/static;             #路径可以自定义，放在什么目录都可以
    }

    location / {
        proxy_pass http://web:3000;     #地址web是docker-compose.yml里面的web服务名
    }
    ...
}

```
### 移动配置文件到conf文件夹
```
mv default.conf conf/
```

### docker-compose.yml
```
version: "3"
services:
        ...
        ...
        nginx:
                image: nginx:1.17
                volumes:
                        - ./static:/code/static
                        - ./conf/default.conf:/etc/nginx/conf.d/default.conf    #挂在nginx服务的配置文件到容器里
                ports:
                        - "80:80"

```
我们有一个配置文件的挂载点，用于更改默认配置，如果mysql也需要更改配置文件，也可以添加一个配置文件的挂载点（也可以是挂载一个配置目录：./conf:/etc/nginx/conf.d）

让我们一次跑3个服务，web,mysql,nginx，看看是否正确运行

```
docker-compose up
```
我们配置了nginx的代理，现在默认访问端口为80，不用再写端口号了

>注意，如果本地安装了nginx需要先停止本地nginx服务 systemctl stop nginx

- 访问`localhost`不带端口号（默认80），是否正常
- 访问`localhost/db`数据库是否连接正常
- 访问`localhost/static/1.jpg`测试static服务是否正常（静态文件就放在本地目录的static下）

## 总结
到此一个基于node的koa，nginx，mysql，开发环境就搭建完成，基于挂载点，开发调试也很方便

如果你本地修改了server.js里面的文件（随便什么文件），nodemon会监听文件变化，自动重启服务

还有一个疑问，本地开发环境好了，是和线上环境一致的，那么怎样部署到服务器呢？

我们下一篇见：[Docker + node(koa) + nginx + mysql 线上环境部署]()

## 附录
### docker-compose.yml
```
version: "3"
services:
        web:
                image: node:12-alpine
                working_dir: /code
                volumes:
                        - .:/code
                ports:
                        - "3000:3000"
                command: npm start
        mysql:
                image: mysql:5.6
                volumes:
                        - ./data:/var/lib/mysql
                environment:
                        - MYSQL_ROOT_PASSWORD=123456
                        - MYSQL_DATABASE=koa_docker
                ports:
                        - "3306:3306"
        nginx:
                image: nginx:1.17
                volumes:
                        - ./static:/code/static
                        - ./conf/default.conf:/etc/nginx/conf.d/default.conf
                ports:
                        - "80:80"

```
### github
- https://github.com/tonysoul/docker-koa

### 参考
- [Docker教程](https://www.runoob.com/docker/docker-tutorial.html)
