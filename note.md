# SCHEMA

Prisma 模式文件（简称：模式文件、Prisma 模式或模式）是 Prisma ORM 设置的主要配置文件。它通常称为 `schema.prisma`，包含以下部分：

- **数据源**: 指定 Prisma ORM 应连接到的数据源的详细信息（例如 PostgreSQL 数据库）
- **生成器**: 指定应根据数据模型生成哪些客户端（例如 Prisma Client）
- **数据模型定义**: 指定应用程序的 模型（每个数据源的数据形状）及其 关系

## 命名

架构文件的默认名称是 `schema.prisma`。当您的架构文件以这种方式命名时，Prisma CLI 将在您调用 CLI 命令的目录（或其任何子目录）中自动检测到它。

如果文件命名不同，您可以使用 --schema 参数向 Prisma CLI 提供架构文件的路径，例如：

```cli
prisma generate --schema ./database/myschema.prisma
```

## Prisma 架构文件位置

1.由 --schema 标志 指定的位置，在您 introspect、generate、migrate 和 studio 时可用

```cli
prisma generate --schema=./alternative/schema.prisma
```

2.在 package.json 文件（版本 2.7.0 及更高版本）中指定的位置

```package.json
"prisma": {
  "schema": "db/schema.prisma"
}
```

3.默认位置

- `./prisma/schema.prisma`
- `./schema.prisma`

## 从架构访问环境变量

可以使用 `env()` 函数访问环境变量。

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## 注释

- `//` 注释：此注释用于读者理解，不会出现在模式文件的抽象语法树 (AST) 中。
- `///` 注释：这些注释将显示在模式文件的抽象语法树 (AST) 中，作为 AST 节点的描述。工具可以使用这些注释来提供更多信息。所有注释都附加到下一个可用的节点 - 自由浮动注释 不受支持，也不包含在 AST 中。

## 数据源

数据源决定了 Prisma ORM 如何连接你的数据库，并由 Prisma 架构中的 `datasource` 块表示。以下数据源使用 postgresql 提供程序并包含一个连接 URL

```prisma
datasource db {
  provider = "postgresql"
  url      = "postgresql://johndoe:mypassword@localhost:5432/mydb?schema=public"
}
```

一个 Prisma 架构只能有一个数据源。但是，你可以:

- 在创建 PrismaClient 时以编程方式覆盖数据源 url
- 如果你使用云托管开发数据库，则为 Prisma Migrate 的影子数据库指定一个不同的 URL

### 保护数据库连接

一些数据源 provider 允许你使用 SSL/TLS 配置连接，并提供 url 的参数以指定证书的位置。

```prisma
datasource db {
  provider = "postgresql"
  url      = "postgresql://johndoe:mypassword@localhost:5432/mydb?schema=public&sslmode=require&sslcert=../server-ca.pem&sslidentity=../client-identity.p12&sslpassword=<REDACTED>"
}
```

## 生成器

Prisma 架构可以有一个或多个生成器，由 `generator` 块表示

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "./generated/prisma-client-js"
}
```

生成器决定在你运行 `prisma generate` 命令时创建哪些资产。主要属性 `provider` 定义创建哪个 `Prisma Client`（特定语言） - 目前，仅提供 `prisma-client-js`。或者，你可以定义遵循我们生成器规范的任何 `npm` 包。此外，你还可以使用 `output` 为生成的资产定义一个自定义输出文件夹。

### Prisma Client：prisma-client-js

Prisma JavaScript Client 的生成器接受多个附加属性

- previewFeatures：要包含的 预览功能
- binaryTargets：prisma-client-js 的引擎二进制目标（例如，如果你部署到 Ubuntu 18+，则为 debian-openssl-1.1.x；如果你在本地工作，则为 native）

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["sample-preview-feature"]
  binaryTargets   = ["linux-musl"]
}
```

### [社区生成器](https://prisma.org.cn/docs/orm/prisma-schema/overview/generators)

## 数据模型定义

### 模型

Prisma 架构 的数据模型定义部分定义了应用程序模型（也称为Prisma 模型）。
模型：

- 表示应用程序域的实体
- 映射到数据库中的表（关系型数据库，如 PostgreSQL）或集合（MongoDB）
- 形成生成的Prisma 客户端 API 中可用查询的基础
- 与 TypeScript 配合使用时，Prisma 客户端为模型提供生成的类型定义，以及它们的任何变体，以使数据库访问完全类型安全。

以下架构描述了一个博客平台 - 数据模型定义已突出显示

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
model User {
  id      Int      @id @default(autoincrement())
  email   String   @unique
  name    String?
  role    Role     @default(USER)
  posts   Post[]
  profile Profile?
}

model Profile {
  id     Int    @id @default(autoincrement())
  bio    String
  user   User   @relation(fields: [userId], references: [id])
  userId Int    @unique
}

model Post {
  id         Int        @id @default(autoincrement())
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt
  title      String
  published  Boolean    @default(false)
  author     User       @relation(fields: [authorId], references: [id])
  authorId   Int
  categories Category[]
}

model Category {
  id    Int    @id @default(autoincrement())
  name  String
  posts Post[]
}

enum Role {
  USER
  ADMIN
}
```

数据模型定义由以下内容组成

- `模型` (`model` 原语) 定义了许多字段，包括模型之间的关系
- `枚举` (`enum` 原语)（如果连接器支持枚举）
- `属性` 和 `函数`，它们会更改字段和模型的行为

#### 内省和迁移

有两种方法可以定义数据模型

- 手动编写数据模型并使用 `Prisma Migrate`：您可以手动编写数据模型，并使用 `Prisma Migrate` 将其映射到数据库。在这种情况下，数据模型是应用程序模型的唯一真实来源。
- 通过内省生成数据模型：如果您有现有的数据库或更喜欢使用 `SQL` 迁移数据库架构，则可以通过 内省 数据库来生成数据模型。在这种情况下，数据库架构是应用程序模型的唯一真实来源。

#### 定义模型

模型表示应用程序域的实体。模型由 `model` 块表示，并定义了许多 字段。在上面的示例数据模型中，User、Profile、Post 和 Category 是模型。

博客平台可以通过以下模型进行扩展

```prisma
model Comment {
  // Fields
}

model Tag {
  // Fields
}
```

#### 使用`@@map()`将模型名称映射到表或集合

```prisma
model Comment {
  // Fields

  @@map("comments")
}
```

#### 定义字段

模型的属性称为字段，它由以下部分组成：

- 字段名称
- 字段类型：字段的类型决定了其结构，并分为以下两类之一
  - 标量类型（包括 `枚举`），它们在数据库中映射到列（`关系数据库`）或文档字段（`MongoDB`） - 例如，`String` 或 `Int`
  - 模型类型（字段称为 `关系字段`） - 例如 `Post` 或 `Comment[]`。
- 可选类型修饰符：可以通过附加两个修饰符中的任何一个来修改字段的类型
  - `[]`将字段设为列表
  - `?`将字段设为可选
    **注意不能将 `[]`和`?`组合使用**
- 可选属性，包括 原生数据库类型属性[##### 不支持的类型]

##### 本机类型映射

支持描述底层数据库类型的**本机数据库类型属性**（类型属性）

```prisma
model Post {
  id      Int    @id
  title   String @db.VarChar(200)
  content String
}
```

类型属性是

- 特定于底层提供程序 - 例如，`PostgreSQL` 使用 `@db.Boolean` 表示 `Boolean`，而 `MySQL` 使用 `@db.TinyInt(1)`
- 以 `PascalCase` 编写（例如，`VarChar` 或 `Text`）
- 以 `@db` 为前缀，其中 `db` 是架构中 `datasource` 块的名称
  此外，在 `自省` 期间，仅当底层本机类型不是默认类型时，才会将类型属性添加到架构中。例如，如果你正在使用 `PostgreSQL` 提供程序，底层本机类型为 `text` 的 `String` 字段将没有类型属性。

###### 优势和工作流

- 控制`Prisma Migrate`在数据库中创建的确切本机类型 - 例如，`String`可以是`@db.VarChar(200)`或`@db.Char(50)`
- 内省时看到丰富的架构

##### 不支持的类型

内省关系数据库时，将不支持的数据类型添加为`Unsupported`

```prisma
location    Unsupported("POLYGON")?
```

#### 定义属性
属性修改字段或模型块的行为。
以下示例包含三个字段属性（@id、@default 和 @unique）和一个块属性（@@unique）：
```prisma
model User {
  id        Int     @id @default(autoincrement())
  firstName String
  lastName  String
  email     String  @unique
  isAdmin   Boolean @default(false)

  @@unique([firstName, lastName])
}
```

#####  定义 ID 字段​：
- `@id`：定义单字段ID
- `@@id`：定义复合ID
- `@unique`：定义唯一标识符，没有定义 `@id`或`@@id`时，作为模型唯一标识

##### `@default()`定义默认值

##### 定义唯一属性
- `@unique`：定义单字段唯一标识
- `@@unique`：定义复合唯一标识


##### `@@index` 定义索引


#### 定义枚举
枚举是通过 enum 块定义的。
```prisma
model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
  role  Role    @default(USER)
}

enum Role {
  USER
  ADMIN
}
```

#### 定义复合类型​
要定义复合类型，请使用类型块。
```prisma
model Product {
  id     String  @id @default(auto()) @map("_id") @db.ObjectId
  name   String
  photos Photo[]
}

type Photo {
  height Int
  width  Int
  url    String
}
```

##### 使用复合类型时的注意事项​
- 复合类型仅支持有限的属性集。支持以下属性：
  - @default
  - @map
  - Native types, such as @db.ObjectId
- 复合类型内部不支持以下属性：
  - @unique
  - @id
  - @relation
  - @ignore
  - @updatedAt






#### [使用函数](https://www.prisma.io/docs/orm/reference/prisma-schema-reference#attribute-functions)

#### [关系](#关系)

#### prisma client

##### [queries(CRUD)](https://www.prisma.io/docs/orm/reference/prisma-client-reference)

##### Type definitions
Prisma Client 还生成反映模型结构的类型定义。这些是生成的 @prisma/client 节点模块的一部分。

#### 限制
记录必须具有唯一性可识别​
- `@id` 或` @@id` 用于单字段或多字段主键约束（每个模型最多一个）
- `@unique` 或 `@@unique` 用于单字段或多字段唯一约束


### 关系

### 索引

### 视图

### 数据库映射

### 如何将 Prisma ORM 与多个数据库模式一起使用

### 不受支持的数据库功能

### 表继承

### [PostgreSQL扩展](https://prisma.org.cn/docs/orm/prisma-schema/postgresql-extensions)

# CLIENT

# MIGRATE

# 工具

# 参考
