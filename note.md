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

Prisma 架构 的数据模型定义部分定义了应用程序模型（也称为 Prisma 模型）。
模型：

- 表示应用程序域的实体
- 映射到数据库中的表（关系型数据库，如 PostgreSQL）或集合（MongoDB）
- 形成生成的 Prisma 客户端 API 中可用查询的基础
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

##### 定义 ID 字段 ​：

- `@id`：定义单字段 ID
- `@@id`：定义复合 ID
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

#### 定义复合类型 ​

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

##### 使用复合类型时的注意事项 ​

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

记录必须具有唯一性可识别 ​

- `@id` 或` @@id` 用于单字段或多字段主键约束（每个模型最多一个）
- `@unique` 或 `@@unique` 用于单字段或多字段唯一约束

### 关系

关系是 Prisma 模式中两个模型之间的连接。

以下 Prisma 架构定义了 User 和 Post 模型之间的一对多关系。突出显示涉及定义关系的字段：

```prisma
model User {
  id    Int    @id @default(autoincrement())
  posts Post[]
}

model Post {
  id       Int  @id @default(autoincrement())
  author   User @relation(fields: [authorId], references: [id])
  authorId Int // relation scalar field  (used in the `@relation` attribute above)
}
```

##### 消除关系的歧义

要消除关系的歧义，您需要使用 `@relation` 属性注释关系字段并提供 `name` 参数。您可以设置任何 `name`（除了空字符串 `""`），但它必须在关系的两侧相同。

```prisma
model User {
  id           Int     @id @default(autoincrement())
  name         String?
  writtenPosts Post[]  @relation("WrittenPosts")
  pinnedPost   Post?   @relation("PinnedPost")
}

model Post {
  id         Int     @id @default(autoincrement())
  title      String?
  author     User    @relation("WrittenPosts", fields: [authorId], references: [id])
  authorId   Int
  pinnedBy   User?   @relation("PinnedPost", fields: [pinnedById], references: [id])
  pinnedById Int?    @unique
}
```

#### [一对一关系](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations/one-to-one-relations)
一对一（1-1）关系是指关系两侧最多可以连接一条记录的关系。
##### 多字段 ID

仅在 **关系型数据库** 中，您还可以使用 多字段 ID 来定义一对一关系。

```prisma
model User {
  firstName String
  lastName  String
  profile   Profile?

  @@id([firstName, lastName])
}

model Profile {
  id            Int    @id @default(autoincrement())
  user          User   @relation(fields: [userFirstName, userLastName], references: [firstName, lastName])
  userFirstName String // relation scalar field (used in the `@relation` attribute above)
  userLastName  String // relation scalar field (used in the `@relation` attribute above)

  @@unique([userFirstName, userLastName])
}
```

##### 必填和可选的 1-1 关系字段 ​

在一对一关系中，没有关系标量的关系一侧（表示数据库中外键的字段）必须是可选的：

```prisma
model User {
  id      Int      @id @default(autoincrement())
  profile Profile? // No relation scalar - must be optional
}
```

但是，您可以选择带有关系标量的关系的一侧是*可选*的还是*强制*的。

#### [一对多关系](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations/one-to-many-relations)
一对多（1-n）关系是指关系一侧的一条记录可以连接到另一侧的零个或多个记录的关系。
在以下示例中，User 模型和 Post 模型之间存在一对多关系：
```prisma
model User {
  id    Int    @id @default(autoincrement())
  posts Post[]
}

model Post {
  id       Int  @id @default(autoincrement())
  author   User @relation(fields: [authorId], references: [id])
  authorId Int
}
```
在前面的示例中，`Post` 模型的作者关系字段引用了 `User` 模型的 `id` 字段。您还可以引用不同的字段。在这种情况下，您需要使用`@unique`属性来标记该字段，以保证只有一个用户连接到每个帖子。
在以下示例中，作者字段引用用户模型中的电子邮件字段，该字段使用 `@unique` 属性进行标记：
```prisma
model User {
  id    Int    @id @default(autoincrement())
  email String @unique // <-- add unique attribute
  posts Post[]
}

model Post {
  id          Int    @id @default(autoincrement())
  authorEmail String
  author      User   @relation(fields: [authorEmail], references: [email])
}
```

##### 关系数据库中的多字段关系​
仅在关系数据库中，您还可以使用多字段 ID/复合键定义此关系：
```prisma
model User {
  firstName String
  lastName  String
  post      Post[]

  @@id([firstName, lastName])
}

model Post {
  id              Int    @id @default(autoincrement())
  author          User   @relation(fields: [authorFirstName, authorLastName], references: [firstName, lastName])
  authorFirstName String // relation scalar field (used in the `@relation` attribute above)
  authorLastName  String // relation scalar field (used in the `@relation` attribute above)
}
```

#### [多对多关系](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations/many-to-many-relations)
多对多 (m-n) 关系是指关系一侧的零个或多个记录可以连接到另一侧的零个或多个记录的关系。

##### connectOrCreate
有时您可能不知道类别记录是否存在。如果类别记录存在，您希望将新的帖子记录连接到该类别。如果 `Category` 记录不存在，您需要先创建该记录，然后将其连接到新的 `Post` 记录。
```ts
const assignCategories = await prisma.post.create({
  data: {
    title: 'How to be Bob',
    categories: {
      create: [
        {
          assignedBy: 'Bob',
          assignedAt: new Date(),
          category: {
            connectOrCreate: {
              where: {
                id: 9,
              },
              create: {
                name: 'New Category',
                id: 9,
              },
            },
          },
        },
      ],
    },
  },
})
```

##### [定义隐式 m-n 关系的规则​](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations/many-to-many-relations#conventions-for-relation-tables-in-implicit-m-n-relations)
**MongoDB 不支持关系数据库中使用的隐式 m-n-关系。**

#### [自关系](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations/self-relations)
关系字段还可以引用其自己的模型，在这种情况下，该关系称为自关系。自关系可以是任何基数：`1-1`、`1-n` 和 `m-n`。

##### 一对一的自我关系：
- 关系的双方必须定义共享相同名称的 `@relation` 属性 - 在本例中为 `BlogOwnerHistory`。
- 一个关系字段必须是完整注释的。在此示例中，后继字段定义了字段参数和引用参数。
- 一个关系字段必须由外键支持。 `successor` 字段由 `successorId` 外键支持，该外键引用 `id` 字段中的值。 `successorId` 标量关系字段还需要 `@unique` 属性来保证一对一关系。

```prisma
model User {
  id          Int     @id @default(autoincrement())
  name        String?
  successorId Int?    @unique
  successor   User?   @relation("BlogOwnerHistory", fields: [successorId], references: [id])
  predecessor User?   @relation("BlogOwnerHistory")
}
```

##### 一对多的自关系​：
```prisma
model User {
  id        Int     @id @default(autoincrement())
  name      String?
  teacherId Int?
  teacher   User?   @relation("TeacherStudents", fields: [teacherId], references: [id])
  students  User[]  @relation("TeacherStudents")
}
```

##### 多对多自关系​​：
```prisma
model User {
  id        Int     @id @default(autoincrement())
  name      String?
  teacherId Int?
  teacher   User?   @relation("TeacherStudents", fields: [teacherId], references: [id])
  students  User[]  @relation("TeacherStudents")
}
```

##### 在同一模型上定义多个自关系​：
```prisma
model User {
  id         Int     @id @default(autoincrement())
  name       String?
  teacherId  Int?
  teacher    User?   @relation("TeacherStudents", fields: [teacherId], references: [id])
  students   User[]  @relation("TeacherStudents")
  followedBy User[]  @relation("UserFollows")
  following  User[]  @relation("UserFollows")
}
```

#### Referential actions
引用操作决定当您的应用程序**删除**或**更新**相关记录时记录会发生什么情况。

| Referential actions                                                                                        | onDelete                               | onUpdate                                                      | 其他说明                                                                                             |
| ---------------------------------------------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Cascade                                                                                                    | 删除引用记录会触发引用记录的删除。     | 如果依赖记录的引用标量字段被更新，则更新关系标量字段。        |                                                                                                      |
| Restrict                                                                                                   | 如果存在任何引用记录，则防止删除。     | 防止引用记录的标识符被更改。                                  |                                                                                                      |
| [NoAction](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations/referential-actions#noaction) |                                        |                                                               | NoAction 操作与 Restrict 类似，两者之间的区别取决于所使用的数据库                                    |
| SetNull                                                                                                    | 引用对象的标量字段将被设置为 NULL。    | 当更新引用对象的标识符时，引用对象的标量字段将被设置为 NULL。 | SetNull 仅适用于可选关系。对于所需的关系，由于标量字段不能为空，因此将引发运行时错误。               |
| SetDefault                                                                                                 | 引用对象的标量字段将设置为字段默认值。 | 引用对象的标量字段将设置为字段默认值。                        | 这些需要使用@default为关系标量字段设置默认值。如果没有为任何标量字段提供默认值，则会引发运行时错误。 |


##### 默认的Referential actions
| 操作     | 可选关系 | 必填关系 |
| -------- | -------- | -------- |
| onDelete | SetNull  | Restric  |
| onUpdate | Cascade  | Cascade  |

##### [参考行动的特殊情况​](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations/referential-actions#special-cases-for-referential-actions)

##### [数据库特定要求​](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations/referential-actions/special-rules-for-referential-actions)

```prisma
model User {
  id    Int    @id @default(autoincrement())
  posts Post[]
}

model Post {
  id     Int          @id @default(autoincrement())
  title  String
  tags   TagOnPosts[]
  User   User?        @relation(fields: [userId], references: [id], onDelete: SetNull, onUpdate: Cascade)
  userId Int?
}

model TagOnPosts {
  id     Int   @id @default(autoincrement())
  post   Post? @relation(fields: [postId], references: [id], onUpdate: Cascade, onDelete: Cascade)
  tag    Tag?  @relation(fields: [tagId], references: [id], onUpdate: Cascade, onDelete: Cascade)
  postId Int?
  tagId  Int?
}

model Tag {
  id    Int          @id @default(autoincrement())
  name  String       @unique
  posts TagOnPosts[]
}
```

#### Relation mode关系模式
Prisma ORM 有两种关系模式：`foreignKeys` 和 `prisma`，它们指定如何强制记录之间的关系。
```prisma
model Post {
  id       Int    @id @default(autoincrement())
  title    String
  author   User   @relation(fields: [authorId], references: [id], onDelete: Cascade, onUpdate: Cascade)
  authorId Int
}

model User {
  id    Int    @id @default(autoincrement())
  posts Post[]
}
```
如果您将 Prisma ORM 与***关系数据库***一起使用，则默认情况下 Prisma ORM 使用外键关系模式，该模式使用外键在数据库级别强制记录之间的关系。

##### 设置关系模式
要设置关系模式，请在数据源块中添加关系模式字段：
- foreignKeys：它使用外键处理数据库中的关系。这是所有关系数据库连接器的默认选项，如果数据源块中未显式设置关系模式，则该选项处于活动状态。
- prisma：这模拟 Prisma 客户端中的关系。当您将 `MySQL` 连接器与 `PlanetScale` 数据库结合使用并且未在 `PlanetScale` 数据库设置中启用本机外键约束时，您还应该启用此选项。
```prisma
datasource db {
  provider     = "mysql"
  url          = env("DATABASE_URL")
  relationMode = "prisma"
}
```
对于 `MongoDB`，唯一可用的选项是 `prisma` 关系模式。如果数据源块中没有显式设置关系模式，则此模式也处于活动状态。

`foreignKeys` 关系模式使用外键处理关系数据库中的关系。当您使用关系数据库连接器（PostgreSQL、MySQL、SQLite、SQL Server、CockroachDB）时，这是默认选项。
使用 `MongoDB` 连接器时，`foreignKeys` 关系模式不可用。一些关系数据库，例如 `PlanetScale`，也禁止使用外键。在这些情况下，您应该使用 `prisma` 关系模式来模拟 Prisma ORM 中的关系。

##### Indexes索引​
在使用外键约束的关系数据库中，数据库通常还会隐式地为外键列创建索引。例如，`MySQL`将在所有外键列上创建索引。这是为了允许外键检查快速运行并且不需要表扫描。
`prisma` 关系模式不使用外键，因此当您使用 `Prisma Migrate` 或 `db Push` 将更改应用到数据库时，不会创建任何索引。相反，您需要使用 `@@index` 属性（或 `@unique`、`@@unique` 或 `@@id` 属性，如果适用）在关系标量字段上手动添加索引。

#### Troubleshooting relations 排查关系问题
对模式进行建模有时会带来一些意想不到的结果。


### 索引

### 视图

### 数据库映射

### 如何将 Prisma ORM 与多个数据库模式一起使用

### 不受支持的数据库功能

### 表继承

### [PostgreSQL 扩展](https://prisma.org.cn/docs/orm/prisma-schema/postgresql-extensions)

# CLIENT

# MIGRATE

# 工具

# 参考
