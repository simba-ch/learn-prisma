@import "https://haogeshuohuanihaohaoting.github.io/static/mdCreateMenu.js"

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

- [在创建 PrismaClient 时以编程方式覆盖数据源 url](https://www.prisma.io/docs/orm/reference/prisma-client-reference#programmatically-override-a-datasource-url)
- [如果你使用云托管开发数据库，则为 Prisma Migrate 的影子数据库指定一个不同的 URL](https://www.prisma.io/docs/orm/prisma-migrate/understanding-prisma-migrate/shadow-database#cloud-hosted-shadow-databases-must-be-created-manually)

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

生成器决定在你运行 `prisma generate` 命令时创建哪些资产。主要属性 `provider` 定义创建哪个 **_Prisma Client_**（特定语言） - 目前，仅提供 `prisma-client-js`。或者，你可以定义遵循我们生成器规范的任何 _npm 包_。此外，你还可以使用 `output` 为生成的资产定义一个自定义输出文件夹。

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
- 可选属性，包括 原生数据库类型属性

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

要定义复合类型，请使用 type。

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

##### 关系数据库中的多字段关系 ​

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
    title: "How to be Bob",
    categories: {
      create: [
        {
          assignedBy: "Bob",
          assignedAt: new Date(),
          category: {
            connectOrCreate: {
              where: {
                id: 9,
              },
              create: {
                name: "New Category",
                id: 9,
              },
            },
          },
        },
      ],
    },
  },
});
```

##### [定义隐式 m-n 关系的规则 ​](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations/many-to-many-relations#conventions-for-relation-tables-in-implicit-m-n-relations)

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

##### 一对多的自关系 ​：

```prisma
model User {
  id        Int     @id @default(autoincrement())
  name      String?
  teacherId Int?
  teacher   User?   @relation("TeacherStudents", fields: [teacherId], references: [id])
  students  User[]  @relation("TeacherStudents")
}
```

##### 多对多自关系 ​​：

```prisma
model User {
  id        Int     @id @default(autoincrement())
  name      String?
  teacherId Int?
  teacher   User?   @relation("TeacherStudents", fields: [teacherId], references: [id])
  students  User[]  @relation("TeacherStudents")
}
```

##### 在同一模型上定义多个自关系 ​：

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

| Referential actions                                                                                        | onDelete                               | onUpdate                                                      | 其他说明                                                                                              |
| ---------------------------------------------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Cascade                                                                                                    | 删除引用记录会触发引用记录的删除。     | 如果依赖记录的引用标量字段被更新，则更新关系标量字段。        |                                                                                                       |
| Restrict                                                                                                   | 如果存在任何引用记录，则防止删除。     | 防止引用记录的标识符被更改。                                  |                                                                                                       |
| [NoAction](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations/referential-actions#noaction) |                                        |                                                               | NoAction 操作与 Restrict 类似，两者之间的区别取决于所使用的数据库                                     |
| SetNull                                                                                                    | 引用对象的标量字段将被设置为 NULL。    | 当更新引用对象的标识符时，引用对象的标量字段将被设置为 NULL。 | SetNull 仅适用于可选关系。对于所需的关系，由于标量字段不能为空，因此将引发运行时错误。                |
| SetDefault                                                                                                 | 引用对象的标量字段将设置为字段默认值。 | 引用对象的标量字段将设置为字段默认值。                        | 这些需要使用@default 为关系标量字段设置默认值。如果没有为任何标量字段提供默认值，则会引发运行时错误。 |

##### 默认的 Referential actions

| 操作     | 可选关系 | 必填关系 |
| -------- | -------- | -------- |
| onDelete | SetNull  | Restric  |
| onUpdate | Cascade  | Cascade  |

##### [参考行动的特殊情况 ​](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations/referential-actions#special-cases-for-referential-actions)

##### [数据库特定要求 ​](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations/referential-actions/special-rules-for-referential-actions)

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

#### Relation mode 关系模式

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

如果您将 Prisma ORM 与 **_关系数据库_** 一起使用，则默认情况下 Prisma ORM 使用外键关系模式，该模式使用外键在数据库级别强制记录之间的关系。

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

##### Indexes 索引 ​

在使用外键约束的关系数据库中，数据库通常还会隐式地为外键列创建索引。例如，`MySQL`将在所有外键列上创建索引。这是为了允许外键检查快速运行并且不需要表扫描。
`prisma` 关系模式不使用外键，因此当您使用 `Prisma Migrate` 或 `db Push` 将更改应用到数据库时，不会创建任何索引。相反，您需要使用 `@@index` 属性（或 `@unique`、`@@unique` 或 `@@id` 属性，如果适用）在关系标量字段上手动添加索引。

#### [Troubleshooting relations 排查关系问题](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations/troubleshooting-relations)

对模式进行建模有时会带来一些意想不到的结果。

##### 如果关系字段的顺序发生变化，隐式多对多自关系会返回不正确的数据 ​

**解决方案 ​：** 重命名隐式多对多自关系中的关系字段，请确保保持字段的字母顺序 - 例如，通过添加前缀 a\_ 和 \_b。

### 索引

Prisma ORM 允许配置数据库索引、唯一约束和主键约束。

#### length 参数

length 参数特定于 `MySQL`，允许您在 `String` 和 `Byte` 类型的列上定义索引和约束。
对于这些类型，`MySQL` 要求您指定要索引的值的子部分的最大长度，以防整个值超出 `MySQL` 对索引大小的限制。
长度参数可用于`@id`、`@@id`、`@unique`、`@@unique` 和`@@index` 属性。
length 参数允许您指定仅 id 值的子部分代表主键。在下面的示例中，使用了前 100 个字符

```prisma
model Id {
  id String @id(length: 100) @db.VarChar(3000)
}
```

长度参数也可以用在复合主键上，使用 `@@id` 属性，如下例所示：

```prisma
model CompoundId {
  id_1 String @db.VarChar(3000)
  id_2 String @db.VarChar(3000)

  @@id([id_1(length: 100), id_2(length: 10)])
}
```

类似的语法可用于`@@unique` 和`@@index` 属性。

#### sort 参数

使用 sort 配置索引排序顺序 ​
sort 参数适用于 Prisma ORM 支持的所有数据库。
它允许您指定索引或约束条目在数据库中的存储顺序。
这可能会影响数据库是否能够对特定查询使用索引。
排序参数可用于` @unique``、@@unique ` 和`@@index` 上的所有数据库。此外，SQL Server 还允许在`@id` 和`@@id` 上使用它。

```prisma
model Unique {
  unique Int @unique(sort: Desc)
}

model CompoundUnique {
  unique_1 Int
  unique_2 Int

  @@unique([unique_1(sort: Desc), unique_2])
}

```

#### 同时使用 `length` 参数 和 `sort` 参数

以下示例演示了如何使用排序和长度参数来配置 Post 模型的索引和约束：

```prisma
model Post {
  title      String   @db.VarChar(300)
  abstract   String   @db.VarChar(3000)
  slug       String   @unique(sort: Desc, length: 42) @db.VarChar(3000)
  author     String
  created_at DateTime

  @@id([title(length: 100, sort: Desc), abstract(length: 10)])
  @@index([author, created_at(sort: Desc)])
}

```

#### type 参数

使用 type 配置索引的访问类型（PostgreSQL）​
type 参数可用于使用 `@@index` 属性配置 `PostgreSQL` 中的索引类型。
可用的索引访问方法有 `Hash`、`Gist`、`Gin`、`SpGist` 和 `Brin`，以及默认的 `BTree` 索引访问方法。

##### Hash

哈希类型将以搜索和插入速度更快的格式存储索引数据，并且使用更少的磁盘空间。但是，只有 = 和 <> 比较可以使用索引，因此其他比较运算符（例如 < 和 >）使用 Hash 会比使用默认 BTree 类型时慢得多。
例如，下面的模型在 value 字段中添加一个 Hash 类型的索引：

```prisma
model Example {
  id    Int @id
  value Int

  @@index([value], type: Hash)
}
```

##### GIN(广义倒排索引)

GIN 索引存储复合值，例如数组或 JsonB 数据。这对于加快查询一个对象是否是另一对象的一部分很有用。它通常用于全文搜索。
索引字段可以定义运算符类，该类定义索引处理的运算符。
作为示例，以下模型将 Gin 索引添加到 value 字段，并使用 JsonbPathOps 作为允许使用该索引的运算符类：

```prisma
model Example {
  id    Int  @id
  value Json
  //    ^ field type matching the operator class
  //                  ^ operator class      ^ index type

  @@index([value(ops: JsonbPathOps)], type: Gin)
}
```

##### GiST(广义搜索树)

GiST 索引类型用于实现用户定义类型的索引方案。
默认情况下，GiST 索引没有太多直接用途，但例如 B-Tree 索引类型是使用 GiST 索引构建的。
作为示例，以下模型将 Gist 索引添加到值字段，并使用 InetOps 作为将使用该索引的运算符：

##### GiST，SP-GiST (空间分区)

SP-GiST 索引对于许多不同的非平衡数据结构来说是一个不错的选择。如果查询符合分区规则，则速度会非常快。
与 GiST 一样，SP-GiST 作为用户定义类型的构建块非常重要，允许直接使用数据库实现自定义搜索运算符。

作为示例，以下模型将 SpGist 索引添加到值字段，并使用 TextOps 作为使用该索引的运算符：

```prisma
model Example {
  id    Int    @id
  value String
  //    ^ field type matching the operator class

  @@index([value], type: SpGist)
  //                     ^ index type
  //       ^ using the default ops: TextOps
}
```

##### BRIN (区块范围指数)

如果您有大量数据在插入后不会更改（例如日期和时间值），则 BRIN 索引类型非常有用。如果您的数据非常适合索引，则它可以在最小的空间中存储大型数据集。
例如，以下模型将 Brin 索引添加到值字段，并使用 Int4BloomOps 作为将使用该索引的运算符：

```prisma
model Example {
  id    Int @id
  value Int
  //    ^ field type matching the operator class
  //                  ^ operator class      ^ index type

  @@index([value(ops: Int4BloomOps)], type: Brin)
}
```

#### clustered 参数

配置索引是集群索引还是非集群索引
clustered 参数可用于在 SQL Server 中配置（非）聚集索引。
它可用于 `@id`、`@@id`、`@unique`、`@@unique` 和 `@@index` 属性。
例如，以下模型将 @id 配置为非集群（而不是默认的集群）：

```prisma
model Example {
  id    Int @id(clustered: false)
  value Int
}
```

一张表最多可以有一个聚集索引。

#### fullTextIndex

要启用 fullTextIndex 预览功能，请将 fullTextIndex 功能标志添加到 schema.prisma 文件的生成器块中：

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["fullTextIndex"]
}
```

以下示例演示了向 Post 模型的标题和内容字段添加 @@fulltext 索引：

```prisma
model Post {
  id      Int    @id
  title   String @db.VarChar(255)
  content String @db.Text

  @@fulltext([title, content])
}
```

在 MongoDB 上，您可以使用 `@@fulltext` 索引属性（通过 fullTextIndex 预览功能）和排序参数，以升序或降序将字段添加到全文索引。以下示例为 Post 模型的 title 和 content 字段添加 @@fulltext 索引，并按降序对 title 字段进行排序：

```prisma
generator js {
  provider        = "prisma-client-js"
  previewFeatures = ["fullTextIndex"]
}

datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

model Post {
  id      String @id @map("_id") @db.ObjectId
  title   String
  content String

  @@fulltext([title(sort: Desc), content])
}
```

### [视图](https://www.prisma.io/docs/orm/prisma-schema/data-model/views)

对视图的支持目前是一个非常早期的预览功能。

### 数据库映射

Prisma 架构包含允许您定义某些数据库对象名称的机制。你可以：

- 将模型和字段名称映射到不同的集合/表和字段/列名称
- 定义约束和索引名称

#### 映射集合/表和字段/列名称 ​

有时，用于描述数据库中实体的名称可能与您在生成的 API 中希望使用的名称不匹配。 Prisma 架构中的映射名称允许您影响客户端 API 中的命名，而无需更改底层数据库名称。
`@map` 和 `@@map` 允许您通过将模型和字段名称与底层数据库中的表和列名称解耦来调整 Prisma 客户端 API 的形状。

- `@@map`属性：重命名模型的名称
- `@map`属性：重命名模型字段

您还可以 `@map `一个枚举值，或 `@@map` 一个枚举：

```prisma
enum Type {
  Blog,
  Twitter @map("comment_twitter")

  @@map("comment_source_enum")
}
```

#### 约束和索引名称

您可以选择使用 `map` *参数*在 Prisma 架构中为属性 `@id`、`@@id`、`@unique`、`@@unique`、`@@index` 和 `@relation` 显式定义底层约束和索引名称。

```prisma
model User {
  id    Int    @id(map: "Custom_Primary_Key_Constraint_Name") @default(autoincrement())
  name  String @unique
  posts Post[]
}

model Post {
  id         Int    @id @default(autoincrement())
  title      String
  authorName String @default("Anonymous")
  author     User?  @relation(fields: [authorName], references: [name])

  @@index([title, authorName], map: "My_Custom_Index_Name")
}
```

##### Prisma ORM 索引和约束的默认命名约定 ​

| Entity            | Convention                        | Example                      |
| ----------------- | --------------------------------- | ---------------------------- |
| Primary Key       | {tablename}\_pkey                 | User_pkey                    |
| Unique Constraint | {tablename}\_{column_names}\_key  | User_firstName_last_Name_key |
| Non-Unique Index  | {tablename}\_{column_names}\_idx  | User_age_idx                 |
| Foreign Key       | {tablename}\_{column_names}\_fkey | User_childName_fkeyUser      |

由于大多数数据库对实体名称有长度限制，因此如有必要，名称将被修剪，以免违反数据库限制。我们将根据需要缩短 \_suffix 之前的部分，以便全名最多达到允许的最大长度。

除了`map`之外，`@@id` 和 `@@unique` 属性还采用可选名称参数，允许您自定义 Prisma 客户端 API。

```prisma
model User {
  firstName String
  lastName  String

  @@id([firstName, lastName])
}
```

```ts
const user = await prisma.user.findUnique({
  where: {
    firstName_lastName: {
      firstName: "Paul",
      lastName: "Panther",
    },
  },
});
```

指定 `@@id([firstName, lastName], name: "fullName")` 会将 Prisma 客户端 API 更改为：

```ts
const user = await prisma.user.findUnique({
  where: {
    fullName: {
      firstName: "Paul",
      lastName: "Panther",
    },
  },
});
```

### 如何将 Prisma ORM 与多个数据库模式一起使用

许多数据库提供程序允许您将*数据库表*组织成命名组。您可以使用它来使数据模型的逻辑结构更易于理解，或者避免表之间的命名冲突。
在 PostgreSQL、CockroachDB 和 SQL Server 中，这些组称为模式。我们将它们称为数据库模式，以区别于 Prisma ORM 自己的模式。

#### 启用多模式

要启用 `multiSchema` 预览功能，请将 `multiSchema` 功能标志添加到 Prisma Schema 中生成器块的 `PreviewFeatures` 字段中：

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["multiSchema"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

#### 在 Prisma 架构中包含多个数据库架构 ​

要在 Prisma 架构文件中使用多个数据库架构，请将数据库架构的名称添加到数据源块中架构字段的数组中。
以下示例添加了 base 和 transactional 架构：

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["multiSchema"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["base", "transactional"]
}

```

您不需要更改连接字符串。连接字符串的架构值是 Prisma 客户端连接到并用于原始查询的默认数据库架构。所有其他 Prisma 客户端查询都使用您正在查询的模型或枚举的架构。
要指定模型或枚举属于特定数据库模式，请添加 `@@schema` 属性，并将数据库模式的名称作为参数。
在以下示例中，User 模型是“base”架构的一部分，`Order` 模型和 `Size` 枚举是“transactional”架构的一部分：

```prisma
model User {
  id     Int     @id
  orders Order[]

  @@schema("base")
}

model Order {
  id      Int  @id
  user    User @relation(fields: [id], references: [id])
  user_id Int

  @@schema("transactional")
}

enum Size {
  Small
  Medium
  Large

  @@schema("transactional")
}
```

#### 不同数据库模式中具有相同名称的表 ​

如果不同数据库模式中具有相同名称的表，则需要将表名称映射到 Prisma 模式中的唯一模型名称。这可以避免您在 Prisma 客户端中查询模型时发生名称冲突。
例如，考虑这样一种情况：基本数据库模式中的配置表与用户数据库模式中的配置表具有相同的名称。为了避免名称冲突，请为 Prisma 架构中的模型指定唯一名称（BaseConfig 和 UserConfig），并使用 `@@map` 属性将每个模型映射到相应的表名称：

```prisma
model BaseConfig {
  id Int @id

  @@map("config")
  @@schema("base")
}

model UserConfig {
  id Int @id

  @@map("config")
  @@schema("users")
}
```

### 不受支持的数据库功能

#### [受支持的数据库功能和特性](https://www.prisma.io/docs/orm/reference/database-features)

#### 本机数据库功能 ​

Prisma 架构语言支持多种可用于设置字段默认值的函数。

```prisma
model Post {
  id String @id @default(uuid())
}
```

但是，您也可以使用本机数据库函数在关系数据库上通过 dbgenerate(...) 定义默认值（MongoDB 没有数据库级函数的概念）。
以下示例使用 PostgreSQL gen_random_uuid() 函数填充 id 字段：

```prisma
model User {
  id String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
}
```

##### 何时使用数据库级函数 ​

- 没有等效的 Prisma ORM 函数（例如 PostgreSQL 中的 gen_random_bytes）。
- 您不能或不想依赖 uuid() 和 cuid() 等函数，这些函数仅在 Prisma ORM 级别实现，并且不会在数据库中体现。
  考虑以下示例，它将 id 字段设置为随机生成的 UUID：

```prisma
model Post {
  id String @id @default(uuid())
}
```

**_仅当您使用 Prisma 客户端创建帖子时才会生成 UUID。_** 如果您以任何其他方式创建帖子，例如用纯 SQL 编写的批量导入脚本，则必须自行生成 UUID。

##### 为本机数据库功能启用 PostgreSQL 扩展 ​

在 PostgreSQL 中，一些本机数据库函数是扩展的一部分。例如，在 PostgreSQL 版本 12.13 及更早版本中， `gen_random_uuid()` 函数是扩展的一部分。
要使用 PostgreSQL 扩展，您必须首先将其安装在数据库服务器的文件系统上。

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [pgcrypto]
}
```

#### 不支持的字段类型 ​(`Unsupported`)

关系数据库的某些数据库类型（例如多边形或几何图形）没有等效的 Prisma 架构语言。使用`Unsupported`的字段类型来表示 Prisma 架构中的字段：

```prisma
model Star {
  id       Int                    @id @default(autoincrement())
  position Unsupported("circle")? @default(dbgenerated("'<(10,4),11>'::circle"))
}
```

#### 不支持的数据库功能 ​

某些功能（例如 SQL 视图或部分索引）无法在 Prisma 架构中表示。如果您的项目使用 Prisma Migrate，则必须将不受支持的功能包含在迁移中。

### 表继承

表继承是一种软件设计模式，允许对实体之间的层次关系进行建模。在数据库级别使用表继承还可以在 JavaScript/TypeScript 应用程序中使用联合类型或跨多个模型共享一组通用属性。

#### 单表继承

单表继承：使用单个表将所有不同实体的数据存储在一个位置。
在我们的示例中，有一个 Activity 表，其中包含 id、url 以及持续时间和正文列。它还使用类型列来指示活动是视频还是文章。

```prisma
model Activity {
  id       Int          @id // shared
  url      String       @unique // shared
  duration Int? // video-only
  body     String? // article-only
  type     ActivityType // discriminator

  owner   User @relation(fields: [ownerId], references: [id])
  ownerId Int
}

enum ActivityType {
  Video
  Article
}

model User {
  id         Int        @id @default(autoincrement())
  name       String?
  activities Activity[]
}
```

#### 多表继承

多表继承：使用多个表分别存储不同实体的数据，并通过外键将它们链接起来。
在我们的示例中，将有一个包含 id、url 列的 Activity 表、一个包含持续时间和外键的 Video 表以及包含正文和外键的 Article 表。还有一个类型列充当鉴别器，指示活动是视频还是文章。请注意，多表继承有时也称为委托类型。

```prisma
model Activity {
  id   Int          @id @default(autoincrement())
  url  String // shared
  type ActivityType // discriminator

  video   Video? // model-specific 1-1 relation
  article Article? // model-specific 1-1 relation

  owner   User @relation(fields: [ownerId], references: [id])
  ownerId Int
}

model Video {
  id         Int      @id @default(autoincrement())
  duration   Int // video-only
  activityId Int      @unique
  activity   Activity @relation(fields: [activityId], references: [id])
}

model Article {
  id         Int      @id @default(autoincrement())
  body       String // article-only
  activityId Int      @unique
  activity   Activity @relation(fields: [activityId], references: [id])
}

enum ActivityType {
  Video
  Article
}

model User {
  id         Int        @id @default(autoincrement())
  name       String?
  activities Activity[]
}
```

#### 单表继承和多表继承之间的权衡

- 数据模型：使用多表继承可能会让数据模型感觉更干净。使用单表模型，您可能会得到非常多的行和许多包含 `NULL` 值的列。
- 性能：多表继承可能会带来性能成本，因为您需要连接父表和子表才能访问与模型相关的所有属性。
- 类型：使用 Prisma ORM，多表继承已经为您提供了特定模型（即上面示例中的文章和视频）的正确类型，而单表继承需要您从头开始创建这些模型。
- ID/主键：使用多表继承，记录有两个可能不匹配的 ID（一个在父表上，另一个在子表上）。您需要在应用程序的业务逻辑中考虑这一点。

#### 第三方解决方案

虽然 Prisma ORM 目前本身不支持联合类型或多态性，但您可以查看 [Zenstack](https://github.com/zenstackhq/zenstack)
，它为 Prisma 模式添加了额外的功能层。阅读他们关于[ Prisma ORM
中多态性的博客文章](https://zenstack.dev/blog/polymorphism)以了解更多信息。

## [Introspection](https://www.prisma.io/docs/orm/prisma-schema/introspection)

您可以使用 Prisma CLI 内省数据库，以便在 Prisma 架构中生成数据模型。生成 Prisma 客户端需要数据模型。
将 Prisma ORM 添加到现有项目时，内省通常用于生成数据模型的初始版本。
但是，它也可以在应用程序中重复使用。当您不使用 Prisma Migrate 但使用纯 SQL 或其他迁移工具执行架构迁移时，最常见的情况是。在这种情况下，您还需要重新检查数据库，然后重新生成 Prisma 客户端以反映 Prisma 客户端 API 中的架构更改。

### introspection 有什么用？

Introspection 有一个主要功能：使用反映当前数据库架构的数据模型填充 Prisma 架构。
![introspection示意图](./assets/prisma-introspection.png)

#### 在 SQL 数据库上的主要功能：

- 将数据库中的表映射到 Prisma 模型
- 将数据库中的列映射到 Prisma 模型的字段
- 将数据库中的索引映射到 Prisma 架构中的索引
- 将数据库约束映射到 Prisma 架构中的属性或类型修饰符

#### 在 MongoDB 数据库上的主要功能：

- 将数据库中的集合映射到 Prisma 模型。由于 MongoDB 中的集合没有预定义的结构，Prisma ORM 对集合中的文档进行采样并相应地派生模型结构（即将文档的字段映射到 Prisma 模型的字段）。如果在集合中检测到嵌入类型，这些类型将映射到 Prisma 架构中的复合类型。
- 将数据库中的索引映射到 Prisma 模式中的索引，如果集合中至少包含一个文档包含索引中包含的字段

## [PostgreSQL 扩展](https://prisma.org.cn/docs/orm/prisma-schema/postgresql-extensions)

# CLIENT

Prisma Client 是一个自动生成且类型安全的查询生成器，专为您的数据量身定制。

## setup & configuration

1. 先决条件
   为了设置 Prisma 客户端，您需要一个带有数据库连接的 Prisma 架构文件、Prisma 客户端生成器和至少一个模型：

   ```prisma
   datasource db {
     url      = env("DATABASE_URL")
     provider = "postgresql"
   }

   generator client {
     provider = "prisma-client-js"
   }

   model User {
     id        Int      @id @default(autoincrement())
     createdAt DateTime @default(now())
     email     String   @unique
     name      String?
   }
   ```

2. 安装
   使用以下命令在您的项目中安装 Prisma 客户端：

   ```cmd
   npm install @prisma/client
   ```

   此命令还运行 prisma generated 命令，该命令将 Prisma Client 生成到 node_modules/.prisma/client 目录中。

3. 导入 Prisma 客户端
   根据您的用例，有多种方法可以将 Prisma 客户端导入到您的项目中：

   ```ts
   import { PrismaClient } from "@prisma/client";

   const prisma = new PrismaClient();
   // use `prisma` in your application to read and write data in your DB
   ```

   对于边缘环境，您可以按如下方式导入 Prisma 客户端：

   ```ts
   import { PrismaClient } from "@prisma/client/edge";

   const prisma = new PrismaClient();
   // use `prisma` in your application to read and write data in your DB
   ```

4. 使用 Prisma 客户端向您的数据库发送查询 ​
   实例化 PrismaClient 后，您可以开始在代码中发送查询：

   ```ts
   // run inside `async` function
   const newUser = await prisma.user.create({
     data: {
       name: "Alice",
       email: "alice@prisma.io",
     },
   });
   const users = await prisma.user.findMany();
   ```

5. 改进您的应用程序 ​
   每当您对 Prisma 架构中反映的数据库进行更改时，您都需要手动重新生成 Prisma Client 以更新 node_modules/.prisma/client 目录中生成的代码：

```cmd
prisma generate
```

### [生成 Prisma Client](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/generating-prisma-client)

Prisma Client 是一个自动生成的数据库客户端，专为您的数据库架构量身定制。默认情况下，Prisma 客户端生成到 node_modules/.prisma/client 文件夹中，但您可以指定自定义位置。
![](./assets/prisma-client-generation.png)

#### 使用自定义输出路径 ​

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/client"
}
```

为该架构文件运行 prisma generated 后，Prisma 客户端包将位于：./src/generated/client

### 实例化 Prisma Client

如何从默认路径导入并实例化生成的客户端：

```ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
```

#### PrismaClient 实例的数量很重要 ​

您的应用程序通常应该只创建一个 PrismaClient 实例。如何实现这一点取决于您是在长时间运行的应用程序中还是在无服务器环境中使用 Prisma ORM。

原因是 PrismaClient 的每个实例都管理一个连接池，这意味着大量客户端可能会耗尽数据库连接限制。这适用于所有数据库连接器。

如果您使用 MongoDB 连接器，连接由 MongoDB 驱动程序连接池管理。如果您使用关系数据库连接器，连接由 Prisma ORM 的连接池管理。 PrismaClient 的每个实例都会创建自己的池。

1. 每个客户端都会创建自己的查询引擎实例。
2. 每个查询引擎都会创建一个连接池，默认池大小为：

- 对于关系数据库，num_physical_cpus \* 2 + 1
- [100 for MongoDB](https://www.mongodb.com/zh-cn/docs/manual/reference/connection-string/)

3. 太多连接可能会开始减慢数据库速度并最终导致错误

### [数据库连接](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections)

### 自定义模型和字段名

使用 `@map` 和 `@@map` 来对 prisma client 和数据库中的表和列进行解耦

### 配置错误格式

### [Formatting levels(格式化级别)](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/error-formatting)

### read replicas (只读副本)

只读副本使您能够跨数据库副本分配工作负载，以应对高流量工作负载。
只读副本扩展 `@prisma/extension-read-replicas` 向 Prisma 客户端添加了对只读数据库副本的支持。

1. 安装扩展

   ```cmd
   npm install @prisma/extension-read-replicas
   ```

2. 通过扩展 Prisma 客户端实例来初始化扩展，并为扩展提供一个指向扩展的 url 选项中的只读副本的连接字符串。

   ```ts
   import { PrismaClient } from "@prisma/client";
   import { readReplicas } from "@prisma/extension-read-replicas";

   const prisma = new PrismaClient().$extends(
     readReplicas({
       url: process.env.DATABASE_URL_REPLICA,
     })
   );

   // Query is run against the database replica
   await prisma.post.findMany();

   // Query is run against the primary database
   await prisma.post.create({
     data: {
       /** */
     },
   });
   ```

   所有读取操作，例如`findMany` 将针对具有上述设置的数据库副本执行。所有写操作 - 例如创建、更新和 `$transaction` 查询将针对您的主数据库执行。

3. 配置多个数据库副本 ​
   url 属性还接受一个值数组，即您想要配置的所有数据库副本的数组：

   ```ts
   const prisma = new PrismaClient().$extends(
     readReplicas({
       url: [
         process.env.DATABASE_URL_REPLICA_1,
         process.env.DATABASE_URL_REPLICA_2,
       ],
     })
   );
   ```

   如果您配置了多个只读副本，系统将随机选择一个数据库副本来执行您的查询。

4. 对主数据库执行读取操作 ​
   您可以使用 `$primary()` 方法对主数据库显式执行读取操作：

   ```ts
   const posts = await prisma.$primary().post.findMany();
   ```

5. 针对数据库副本执行操作 ​
   您可以使用 `$replica()` 方法对副本而不是主数据库显式执行查询：
   ```ts
   const result = await prisma.$replica().user.findFirst();
   ```

### [database polyfills](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/database-polyfills)

## queries

### CRUD

#### Create

##### 创建单个记录 ​

```ts
import { PrismaClient, Prisma } from "@prisma/client";
const prisma = new PrismaClient();

const user = await prisma.user.create({
  data: {
    email: "elsa@prisma.io",
    name: "Elsa Prisma",
  },
});
// 返回结果
// {
//   id: 22,
//   name: 'Elsa Prisma',
//   email: 'elsa@prisma.io',
//   profileViews: 0,
//   role: 'USER',
//   coinflips: []
// }

async function main() {
  let includePosts: boolean = false;
  let user: Prisma.UserCreateInput;

  // Check if posts should be included in the query
  // 以下示例产生相同的结果，但在 create() 查询的上下文之外创建一个名为 user 的 UserCreateInput 变量。完成简单的检查（“post是否应该包含在此 create() 查询中？”）后，用户变量将传递到查询中：
  if (includePosts) {
    user = {
      email: "elsa@prisma.io",
      name: "Elsa Prisma",
      posts: {
        create: {
          title: "Include this post!",
        },
      },
    };
  } else {
    user = {
      email: "elsa@prisma.io",
      name: "Elsa Prisma",
    };
  }

  // Pass 'user' object into query
  const createUser = await prisma.user.create({ data: user });
}
main();
```

##### 创建多条记录 ​

```ts
const createMany = await prisma.user.createMany({
  data: [
    { name: "Bob", email: "bob@prisma.io" },
    { name: "Bobo", email: "bob@prisma.io" }, // Duplicate unique key!
    { name: "Yewande", email: "yewande@prisma.io" },
    { name: "Angelique", email: "angelique@prisma.io" },
  ],
  skipDuplicates: true, // Skip 'Bobo'
});
// 返回结果
// {
//   count: 3
// }
```

##### [创建记录并连接或创建相关记录 ​](#relation-queries) ​

##### 创建并返回多条记录 ​

```ts
const users = await prisma.user.createManyAndReturn({
  data: [
    { name: "Alice", email: "alice@prisma.io" },
    { name: "Bob", email: "bob@prisma.io" },
  ],
});

// 返回结果
// [{
//   id: 22,
//   name: 'Alice',
//   email: 'alice@prisma.io',
//   profileViews: 0,
//   role: 'USER',
//   coinflips: []
// }, {
//   id: 23,
//   name: 'Bob',
//   email: 'bob@prisma.io',
//   profileViews: 0,
//   role: 'USER',
//   coinflips: []
// }]
```

#### Read

##### 通过 ID 或唯一标识符获取记录 ​

```ts
// By unique identifier
const user = await prisma.user.findUnique({
  where: {
    email: "elsa@prisma.io",
  },
});

// By ID
const user = await prisma.user.findUnique({
  where: {
    id: 99,
  },
});
```

##### 获取所有记录 ​

```ts
const users = await prisma.user.findMany();
```

您还可以对结果进行[分页](#pagination)。

##### 获取符合特定条件的第一条记录 ​

1. 按 ID 降序排列用户（最大的在前）- 最大的 ID 是最新的
2. 按降序返回第一个至少有一个帖子获得超过 100 个赞的用户

```ts
const findUser = await prisma.user.findFirst({
  where: {
    posts: {
      some: {
        likes: {
          gt: 100,
        },
      },
    },
  },
  orderBy: {
    id: "desc",
  },
});
```

##### 获取过滤后的记录列表

Prisma Client 支持对记录字段和相关记录字段进行过滤。

###### 按单个字段值过滤 ​

以下查询返回电子邮件以“prisma.io”结尾的所有用户记录：

```ts
const users = await prisma.user.findMany({
  where: {
    email: {
      endsWith: "prisma.io",
    },
  },
});
```

###### 按多个字段值过滤 ​

​ 以下查询使用[运算符](#filter-conditions-and-operators)组合返回名称以 E 开头的用户或至少具有 1 个配置文件视图的管理员：

```ts
const users = await prisma.user.findMany({
  where: {
    OR: [
      {
        name: {
          startsWith: "E",
        },
      },
      {
        AND: {
          profileViews: {
            gt: 0,
          },
          role: {
            equals: "ADMIN",
          },
        },
      },
    ],
  },
});
```

###### [按相关记录字段值过滤](#relation-queries) ​

以下查询返回电子邮件以 prisma.io 结尾且至少有一篇（某些）帖子未发布的用户：

```ts
const users = await prisma.user.findMany({
  where: {
    email: {
      endsWith: "prisma.io",
    },
    posts: {
      some: {
        published: false,
      },
    },
  },
});
```

##### [选择字段的子集](#select-fields) ​

以下 findUnique() 查询使用 select 返回特定用户记录的电子邮件和姓名字段：

```ts
const user = await prisma.user.findUnique({
  where: {
    email: "emma@prisma.io",
  },
  select: {
    email: true,
    name: true,
  },
});
```

##### 选择相关记录字段的子集 ​

​ 以下查询使用嵌套选择来返回：

- 用户的电子邮件
- 每个帖子的点赞字段

```ts
const user = await prisma.user.findUnique({
  where: {
    email: "emma@prisma.io",
  },
  select: {
    email: true,
    posts: {
      select: {
        likes: true,
      },
    },
  },
});

// 返回结果
// { email: 'emma@prisma.io', posts: [ { likes: 0 }, { likes: 0 } ] }
```

##### [选择相关记录字段的子集](#aggregationgroupingand-summarizing) ​

##### [选择不同的字段值](#aggregationgroupingand-summarizing)​

##### [包括相关记录](#select-fields)

以下查询返回所有 ADMIN 用户并在结果中包含每个用户的帖子

```ts
const users = await prisma.user.findMany({
  where: {
    role: "ADMIN",
  },
  include: {
    posts: true,
  },
});
```

##### [包括经过过滤的关系列表 ​](#filter-a-list-of-relations) ​ ​

#### Update

##### 更新单条记录 ​

以下查询使用 update() 通过电子邮件查找并更新单个用户记录：

```ts
const updateUser = await prisma.user.update({
  where: {
    email: "viola@prisma.io",
  },
  data: {
    name: "Viola the Magnificent",
  },
});

// {
//    "id": 43,
//    "name": "Viola the Magnificent",
//    "email": "viola@prisma.io",
//    "profileViews": 0,
//    "role": "USER",
//    "coinflips": [],
// }
```

##### 更新多条记录

以下查询使用 updateMany() 更新包含 prisma.io 的所有用户记录：

```ts
const updateUsers = await prisma.user.updateMany({
  where: {
    email: {
      contains: "prisma.io",
    },
  },
  data: {
    role: "ADMIN",
  },
});
// {
//    "count": 19
// }
```

##### 更新或创建记录 ​

以下查询使用 upsert() 更新具有特定电子邮件地址的用户记录，或者创建该用户记录（如果不存在）：

```ts
const upsertUser = await prisma.user.upsert({
  where: {
    email: "viola@prisma.io",
  },
  update: {
    name: "Viola the Magnificent",
  },
  create: {
    email: "viola@prisma.io",
    name: "Viola the Magnificent",
  },
});

// {
//    "id": 43,
//    "name": "Viola the Magnificent",
//    "email": "viola@prisma.io",
//    "profileViews": 0,
//    "role": "ADMIN",
//    "coinflips": [],
// }
```

##### 查找或创建记录 ​

Prisma 客户端没有 findOrCreate() 查询。您可以使用 upsert() 作为解决方法。要使 upsert() 的行为类似于 findOrCreate() 方法，请向 upsert() 提供一个空更新参数。

##### 更新数字字段 ​

使用原子数运算根据当前值更新数字字段 - 例如递增或乘法。以下查询将视图和喜欢字段加 1：

```ts
const updatePosts = await prisma.post.updateMany({
  data: {
    views: {
      increment: 1,
    },
    likes: {
      increment: 1,
    },
  },
});
```

##### [连接和断开相关记录 ​](#relation-queries)

#### Delete

##### 删除单条记录 ​

以下查询使用 delete()删除单个用户记录：

```ts
const deleteUser = await prisma.user.delete({
  where: {
    email: "bert@prisma.io",
  },
});
```

尝试删除具有一个或多个帖子的用户会导致错误，因为每个帖子都需要一个作者 - [请参阅级联删除](#referential-actions)。

##### 删除多条记录 ​

以下查询使用 deleteMany()删除电子邮件包含 prisma.io 的所有用户记录：

```ts
const deleteUsers = await prisma.user.deleteMany({
  where: {
    email: {
      contains: "prisma.io",
    },
  },
});
```

##### 删除多条记录 ​

以下查询使用 deleteMany()删除所有用户记录：

```ts
const deleteUsers = await prisma.user.deleteMany({});
```

##### [级联删除（删除相关记录）](https://www.prisma.io/docs/orm/prisma-client/queries/crud#cascading-deletes-deleting-related-records)

##### [删除所有表中的所有记录 ​](https://www.prisma.io/docs/orm/prisma-client/queries/crud#delete-all-records-from-all-tables)

#### Advanced query examples

##### 创建深度嵌套的记录树 ​ ​

1. 单个用户
2. 两个新的相关帖子记录
3. 连接或创建每个帖子的类别

```ts
const u = await prisma.user.create({
  include: {
    posts: {
      include: {
        categories: true,
      },
    },
  },
  data: {
    email: "emma@prisma.io",
    posts: {
      create: [
        {
          title: "My first post",
          categories: {
            connectOrCreate: [
              {
                create: { name: "Introductions" },
                where: {
                  name: "Introductions",
                },
              },
              {
                create: { name: "Social" },
                where: {
                  name: "Social",
                },
              },
            ],
          },
        },
        {
          title: "How to make cookies",
          categories: {
            connectOrCreate: [
              {
                create: { name: "Social" },
                where: {
                  name: "Social",
                },
              },
              {
                create: { name: "Cooking" },
                where: {
                  name: "Cooking",
                },
              },
            ],
          },
        },
      ],
    },
  },
});
```

### Select fields

默认情况下，当查询返回记录（而不是计数）时，结果包括：

- 模型的所有标量字段（包括枚举）
- 模型上没有定义关系

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  role      Role     @default(USER)
  posts     Post[]
}

model Post {
  id        Int      @id @default(autoincrement())
  published Boolean  @default(false)
  title     String
  author    User?    @relation(fields: [authorId], references: [id])
  authorId  Int?
}

enum Role {
  USER
  ADMIN
}
```

对 User 模型的查询将包括 id、email、name 和 role 字段（因为这些是标量字段），但不包括 posts 字段（因为这是一个关系字段）：

```ts
const users = await prisma.user.findFirst();
// {
//   id: 42,
//   name: "Sabelle",
//   email: "sabelle@prisma.io",
//   role: "ADMIN"
// }
```

如果您想自定义结果并返回不同的字段组合，您可以：

- 使用 `select` 返回特定字段。您还可以通过选择关系字段来使用嵌套选择。
- 使用 `omit` 从结果中排除特定字段。 `omit` 可以看作是 `select` 的“相反”。
- 使用 `include` 来额外包含关系。

在所有情况下，查询结果都将是静态类型的，确保您不会意外访问未从数据库中实际查询的任何字段。
仅选择所需的字段和关系，而不是依赖默认选择集，可以减少响应的大小并提高查询速度。

#### 选择特定字段

使用 `select` 返回字段的子集而不是所有字段。以下示例仅返回电子邮件和姓名字段：

```ts
const user = await prisma.user.findFirst({
  select: {
    email: true,
    name: true,
  },
});

// {
//   name: "Alice",
//   email: "alice@prisma.io",
// }
```

#### 通过选择关系字段返回嵌套对象 ​

```ts
const usersWithPostTitles = await prisma.user.findFirst({
  select: {
    name: true,
    posts: {
      select: { title: true },
    },
  },
});

// {
//   "name":"Sabelle",
//   "posts":[
//     { "title":"Getting started with Azure Functions" },
//     { "title":"All about databases" }
//   ]
// }
```

#### 省略特定字段 ​

在某些情况下，您可能想要返回模型的大部分字段，仅排除一小部分字段。
在这些情况下，您可以使用 omit，它可以看作是 select 的对应项：

```ts
const users = await prisma.user.findFirst({
  omit: {
    password: true,
  },
});

// {
//   id: 9
//   name: "Sabelle",
//   email: "sabelle@prisma.io",
//   password: "mySecretPassword4",
//   profileViews: 90,
//   role: "USER",
//   coinflips: [],
// }
```

### Relation queries

Prisma Client 的一个关键功能是能够查询两个或多个模型之间的关系。关系查询包括：

- 通过 `select` 和 `include` 进行嵌套读取
- 具有事务保证的嵌套写入
- 过滤相关记录

#### 嵌套读取 ​

嵌套读取允许您从数据库中的多个表中读取相关数据。

##### Relation load strategies

由于“relationLoadStrategy”选项当前处于预览状态，因此您需要通过 Prisma 架构文件中的“relationJoins”预览功能标志来启用它：

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["relationJoins"]
}
```

添加此标志后，您需要再次运行 `prisma generate` 以重新生成 Prisma Client。此功能目前在 PostgreSQL、CockroachDB 和 MySQL 上可用。

Prisma 客户端支持两种关系加载策略：

- `join`（默认）：使用数据库级 LATERAL JOIN (PostgreSQL) 或相关子查询 (MySQL)，并通过对数据库的单个查询获取所有数据。
- `query`：将多个查询发送到数据库（每个表一个）并在应用程序级别连接它们。

这两个选项之间的另一个重要区别是`join`策略在数据库级别使用 JSON 聚合。这意味着它创建的 Prisma 客户端返回的 JSON 结构已经存在于数据库中，从而节省了应用程序级别的计算资源。

您可以在任何支持包含或选择的查询中使用顶层的`relationLoadStrategy` 选项。

```ts
const users = await prisma.user.findMany({
  relationLoadStrategy: "join", // or 'query'
  include: {
    posts: true,
  },
});

const users = await prisma.user.findMany({
  relationLoadStrategy: "join", // or 'query'
  select: {
    posts: true,
  },
});
```

###### 何时使用哪种加载策略？​

- 在大多数情况下，`join`策略（默认）会更有效。在 PostgreSQL 上，它结合使用 LATERAL JOIN 和 JSON 聚合来减少结果集中的冗余，并委托将查询结果转换为数据库服务器上预期的 JSON 结构的工作。在 MySQL 上，它使用相关子查询来通过单个查询获取结果。
- 可能存在边缘情况，根据数据集和查询的特征，`query`可以提高性能。我们建议您分析数据库查询以识别这些情况。
- 如果您希望节省数据库服务器上的资源并在应用程序服务器中执行繁重的数据合并和转换工作（这可能更容易扩展），请使用`query`。

##### Include

```ts
const user = await prisma.user.findFirst({
  include: {
    posts: true,
  },
});

// {
//   id: 19,
//   name: null,
//   email: 'emma@prisma.io',
//   profileViews: 0,
//   role: 'USER',
//   coinflips: [],
//   posts: [
//     {
//       id: 20,
//       title: 'My first post',
//       published: true,
//       authorId: 19,
//       comments: null,
//       views: 0,
//       likes: 0
//     },
//     {
//       id: 21,
//       title: 'How to make cookies',
//       published: true,
//       authorId: 19,
//       comments: null,
//       views: 0,
//       likes: 0
//     }
//   ]
// }
```

###### 嵌套 Include

```ts
const user = await prisma.user.findFirst({
  include: {
    posts: {
      include: {
        categories: true,
      },
    },
  },
});

// {
//     "id": 40,
//     "name": "Yvette",
//     "email": "yvette@prisma.io",
//     "profileViews": 0,
//     "role": "USER",
//     "coinflips": [],
//     "testing": [],
//     "city": null,
//     "country": "Sweden",
//     "posts": [
//         {
//             "id": 66,
//             "title": "How to make an omelette",
//             "published": true,
//             "authorId": 40,
//             "comments": null,
//             "views": 0,
//             "likes": 0,
//             "categories": [
//                 {
//                     "id": 3,
//                     "name": "Easy cooking"
//                 }
//             ]
//         },
//         {
//             "id": 67,
//             "title": "How to eat an omelette",
//             "published": true,
//             "authorId": 40,
//             "comments": null,
//             "views": 0,
//             "likes": 0,
//             "categories": []
//         }
//     ]
// }
```

##### Select

您可以使用嵌套选择来选择要返回的关系字段的子集。

```ts
const user = await prisma.user.findFirst({
  select: {
    name: true,
    posts: {
      select: {
        title: true,
      },
    },
  },
});

// {
//   name: "Elsa",
//   posts: [ { title: 'My first post' }, { title: 'How to make cookies' } ]
// }
```

###### 嵌套使用 Include 和 Select

```ts
const user = await prisma.user.findFirst({
  include: {
    posts: {
      select: {
        title: true,
      },
    },
  },
});

// {
//   "id": 1,
//   "name": null,
//   "email": "martina@prisma.io",
//   "profileViews": 0,
//   "role": "USER",
//   "coinflips": [],
//   "posts": [
//     { "title": "How to grow salad" },
//     { "title": "How to ride a horse" }
//   ]
// }
```

###### 不能在同一级别使用 Select 和 Include

请注意，您不能在同一级别上使用 `select` 和 `include`。

```ts
// The following query returns an exception
const user = await prisma.user.findFirst({
  select: { // This won't work!
    email:  true
  }
  include: { // This won't work!
    posts: {
      select: {
        title: true
      }
    }
  },
})
```

相反，使用嵌套选择选项：

```ts
const user = await prisma.user.findFirst({
  select: {
    // This will work!
    email: true,
    posts: {
      select: {
        title: true,
      },
    },
  },
});
```

#### 关系计数

您可以在`include`或`select`内字段旁边使用关系计数

```ts
const relationCount = await prisma.user.findMany({
  include: {
    _count: {
      select: { posts: true },
    },
  },
});

// { id: 1, _count: { posts: 3 } },
// { id: 2, _count: { posts: 2 } },
// { id: 3, _count: { posts: 2 } },
// { id: 4, _count: { posts: 0 } },
// { id: 5, _count: { posts: 0 } }
```

#### filter a list of relations

当您使用 `select` 或 `include` 返回相关数据的子集时，您可以对 `select` 或 `include` 内的关系列表进行过滤和排序。

```ts
const result = await prisma.user.findFirst({
  select: {
    posts: {
      where: {
        published: false,
      },
      orderBy: {
        title: "asc",
      },
      select: {
        title: true,
      },
    },
  },
});

// 您还可以使用 include 编写相同的查询，如下所示：
const result = await prisma.user.findFirst({
  include: {
    posts: {
      where: {
        published: false,
      },
      orderBy: {
        title: "asc",
      },
    },
  },
});
```

#### 嵌套写入

嵌套写入允许您在单个事务中将关系数据写入数据库。

- 为在单个 Prisma 客户端查询中跨多个表创建、更新或删除数据提供事务保证。如果查询的任何部分失败（例如，创建用户成功但创建帖子失败），Prisma 客户端将回滚所有更改。
- 支持数据模型支持的任何级别的嵌套。
- 使用模型的创建或更新查询时可用于关系字段。

##### 创建相关记录 ​

您可以同时创建一条记录和一条或多条相关记录。以下查询创建一条 User 记录和两条相关的 Post 记录：

```ts
const result = await prisma.user.create({
  data: {
    email: "elsa@prisma.io",
    name: "Elsa Prisma",
    posts: {
      create: [
        { title: "How to make an omelette" },
        { title: "How to eat an omelette" },
      ],
    },
  },
  include: {
    posts: true, // Include all posts in the returned object
  },
});

// {
//   id: 29,
//   name: 'Elsa',
//   email: 'elsa@prisma.io',
//   profileViews: 0,
//   role: 'USER',
//   coinflips: [],
//   posts: [
//     {
//       id: 22,
//       title: 'How to make an omelette',
//       published: true,
//       authorId: 29,
//       comments: null,
//       views: 0,
//       likes: 0
//     },
//     {
//       id: 23,
//       title: 'How to eat an omelette',
//       published: true,
//       authorId: 29,
//       comments: null,
//       views: 0,
//       likes: 0
//     }
//   ]
// }
```

##### 创建单个记录和多个相关记录 ​

- 使用嵌套 `create` 查询
- 使用嵌套的 `createMany` 查询
  在大多数情况下，除非需要`skipDuplicates` 查询选项，否则嵌套`create`会更好。这是一个描述这两个选项之间差异的快速表格：

| feature          | create | createMany | notes                                                                                                                                 |
| ---------------- | ------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 支持嵌套附加关系 | ✔      | ✘ \*       | 例如，您可以在一个查询中创建一个用户、多个帖子以及每个帖子的多个评论。<br/> \* 您可以在一对一关系中手动设置外键 - 例如：{authorId: 9} |
| 支持 1-n 关系    | ✔      | ✔          | 例如，您可以创建一个用户和多个帖子（一个用户有多个帖子）                                                                              |
| 支持 m-n 关系    | ✔      | ✘          | 例如，您可以创建一个帖子和多个类别（一个帖子可以有多个类别，一个类别可以有多个帖子）                                                  |
| 支持跳过重复记录 | ✘      | ✔          | 使用 skipDuplicates 查询选项。                                                                                                        |

###### 使用嵌套 create

```ts
const result = await prisma.user.create({
  data: {
    email: "yvette@prisma.io",
    name: "Yvette",
    posts: {
      create: [
        {
          title: "How to make an omelette",
          categories: {
            create: {
              name: "Easy cooking",
            },
          },
        },
        { title: "How to eat an omelette" },
      ],
    },
  },
  include: {
    // Include posts
    posts: {
      include: {
        categories: true, // Include post categories
      },
    },
  },
});
```

###### 使用嵌套 createMany

```ts
const result = await prisma.user.create({
  data: {
    email: "saanvi@prisma.io",
    posts: {
      createMany: {
        data: [{ title: "My first post" }, { title: "My second post" }],
      },
    },
  },
  include: {
    posts: true,
  },
});
```

##### 创建多条记录和多条相关记录 ​

您无法访问 `createMany()` 或 `createManyAndReturn()` 查询中的关系，这意味着您无法在单个嵌套写入中创建多个用户和多个帖子。以下情况是不可能的：

```ts
const createMany = await prisma.user.createMany({
  data: [
    {
      name: "Yewande",
      email: "yewande@prisma.io",
      posts: {
        // Not possible to create posts!
      },
    },
    {
      name: "Noor",
      email: "noor@prisma.io",
      posts: {
        // Not possible to create posts!
      },
    },
  ],
});
```

##### 连接多个记录 ​

以下查询创建 (create ) 一条新用户记录并将该记录连接 (connect ) 到三个现有帖子：

```ts
const result = await prisma.user.create({
  data: {
    email: "vlad@prisma.io",
    posts: {
      connect: [{ id: 8 }, { id: 9 }, { id: 10 }],
    },
  },
  include: {
    posts: true, // Include all posts in the returned object
  },
});
```

##### 连接单个记录 ​

您可以将现有记录连接到新用户或现有用户。以下查询将现有帖子 (id: 11) 连接到现有用户 (id: 9)

```ts
const result = await prisma.user.update({
  where: {
    id: 9,
  },
  data: {
    posts: {
      connect: {
        id: 11,
      },
    },
  },
  include: {
    posts: true,
  },
});
```

##### 连接单个记录 ​

如果相关记录可能存在或不存在，请使用 `connectOrCreate` 连接相关记录：

```ts
const result = await prisma.post.create({
  data: {
    title: "How to make croissants",
    author: {
      connectOrCreate: {
        where: {
          email: "viola@prisma.io",
        },
        create: {
          email: "viola@prisma.io",
          name: "Viola",
        },
      },
    },
  },
  include: {
    author: true,
  },
});
```

##### 断开相关记录 ​

要断开记录列表中的一个（例如，特定的博客文章），请提供要断开连接的记录的 ID 或唯一标识符：

```ts
const result = await prisma.user.update({
  where: {
    id: 16,
  },
  data: {
    posts: {
      disconnect: [{ id: 12 }, { id: 19 }],
    },
  },
  include: {
    posts: true,
  },
});
```

要断开一条记录（例如，帖子的作者），请使用`disconnect: true`：

```ts
const result = await prisma.post.update({
  where: {
    id: 23,
  },
  data: {
    author: {
      disconnect: true,
    },
  },
  include: {
    author: true,
  },
});
```

##### 断开所有相关记录 ​

要断开一对多关系中的所有相关记录（用户有许多帖子），请将关系设置为空列表，如下所示：

```ts
const result = await prisma.user.update({
  where: {
    id: 16,
  },
  data: {
    posts: {
      set: [],
    },
  },
  include: {
    posts: true,
  },
});
```

##### 删除所有相关记录 ​

删除所有相关的 Post 记录：

```ts
const result = await prisma.user.update({
  where: {
    id: 11,
  },
  data: {
    posts: {
      deleteMany: {},
    },
  },
  include: {
    posts: true,
  },
});
```

##### 删除特定相关记录 ​

通过删除所有未发布的帖子来更新用户：

```ts
const result = await prisma.user.update({
  where: {
    id: 11,
  },
  data: {
    posts: {
      deleteMany: {
        published: false,
      },
    },
  },
  include: {
    posts: true,
  },
});
```

通过删除特定帖子来更新用户：

```ts
const result = await prisma.user.update({
  where: {
    id: 6,
  },
  data: {
    posts: {
      deleteMany: [{ id: 7 }],
    },
  },
  include: {
    posts: true,
  },
});
```

##### 更新所有相关记录（或过滤器）​

您可以使用嵌套的 `updateMany` 来更新特定用户的所有相关记录。以下查询取消发布特定用户的所有帖子：

```ts
const result = await prisma.user.update({
  where: {
    id: 6,
  },
  data: {
    posts: {
      updateMany: {
        where: {
          published: true,
        },
        data: {
          published: false,
        },
      },
    },
  },
  include: {
    posts: true,
  },
});
```

##### 更新具体相关记录 ​​

```ts
const result = await prisma.user.update({
  where: {
    id: 6,
  },
  data: {
    posts: {
      update: {
        where: {
          id: 9,
        },
        data: {
          title: "My updated title",
        },
      },
    },
  },
  include: {
    posts: true,
  },
});
```

##### 更新或创建相关记录 ​

以下查询使用嵌套 `upsert` 来更新“bob@prisma.io”（如果该用户存在），或者创建该用户（如果不存在）：

```ts
const result = await prisma.post.update({
  where: {
    id: 6,
  },
  data: {
    author: {
      upsert: {
        create: {
          email: "bob@prisma.io",
          name: "Bob the New User",
        },
        update: {
          email: "bob@prisma.io",
          name: "Bob the existing user",
        },
      },
    },
  },
  include: {
    author: true,
  },
});
```

##### 将新的相关记录添加到现有记录 ​

您可以将 `create` 或 `createMany` 嵌套在更新内，以将新的相关记录添加到现有记录。以下查询向 id 为 9 的用户添加两个帖子：

```ts
const result = await prisma.user.update({
  where: {
    id: 9,
  },
  data: {
    posts: {
      createMany: {
        data: [{ title: "My first post" }, { title: "My second post" }],
      },
    },
  },
  include: {
    posts: true,
  },
});
```

#### 关系过滤器 ​

##### 过滤 “-to-many” 关系

Prisma 客户端提供了 `some`、`every` 和 `none` 选项，用于根据关系的“对多”端相关记录的属性来过滤记录。
例如，以下查询返回满足以下条件的用户：

- 没有帖子的浏览量超过 100 次
- 所有帖子的点赞数均小于或等于 50

```ts
const users = await prisma.user.findMany({
  where: {
    posts: {
      none: {
        views: {
          gt: 100,
        },
      },
      every: {
        likes: {
          lte: 50,
        },
      },
    },
  },
  include: {
    posts: true,
  },
});
```

##### 过滤 “-to-one” 关系

Prisma 客户端提供 `is` 和 `isNot` 选项，用于根据关系的“一对一”侧相关记录的属性来过滤记录。
例如，以下查询返回满足以下条件的 Post 记录：

- 作者的名字不能是 “Bob”
- 作者的年龄大于 40

```ts
const users = await prisma.post.findMany({
  where: {
    author: {
      isNot: {
        name: "Bob",
      },
      is: {
        age: {
          gt: 40,
        },
      },
    },
  },
  include: {
    author: true,
  },
});
```

##### 过滤不存在的 “-to-many” 关系

例如，以下查询使用 `none` 返回具有零个帖子的所有用户

```ts
const usersWithZeroPosts = await prisma.user.findMany({
  where: {
    posts: {
      none: {},
    },
  },
  include: {
    posts: true,
  },
});
```

##### 过滤不存在的 “-to-one” 关系

以下查询返回所有没有作者关系的帖子：

```ts
const postsWithNoAuthor = await prisma.post.findMany({
  where: {
    author: null, // or author: { }
  },
  include: {
    author: true,
  },
});
```

##### 过滤相关记录的存在 ​

以下查询返回至少拥有一篇帖子的所有用户：

```ts
const usersWithSomePosts = await prisma.user.findMany({
  where: {
    posts: {
      some: {},
    },
  },
  include: {
    posts: true,
  },
});
```

#### Fluent API

流畅的 API 让您可以通过函数调用流畅地遍历模型的关系。请注意，最后一个函数调用确定整个查询的返回类型（在下面的代码片段中添加相应的类型注释以使其明确）。
此查询返回特定用户的所有帖子记录：

```ts
const postsByUser: Post[] = await prisma.user
  .findUnique({ where: { email: "alice@prisma.io" } })
  .posts();
```

这相当于以下 findMany 查询：

```ts
const postsByUser = await prisma.post.findMany({
  where: {
    author: {
      email: "alice@prisma.io",
    },
  },
});
```

查询之间的主要区别在于，流畅的 API 调用被转换为两个单独的数据库查询，而另一个仅生成单个查询（[请参阅此 GitHub 问题](https://github.com/prisma/prisma/issues/1984)）

请注意，您可以根据需要链接任意数量的查询。在此示例中，链接从“个人资料”开始，然后经过“用户”到“帖子”：

```ts
const posts: Post[] = await prisma.profile
  .findUnique({ where: { id: 1 } })
  .user()
  .posts();
```

链接的唯一要求是先前的函数调用必须仅返回单个对象（例如，由 findUnique 查询或像 profile.user() 这样的“一对一关系”返回）。

以下查询是不可能的，因为 findMany 不返回单个对象而是一个列表：

```ts
// This query is illegal
const posts = await prisma.user.findMany().posts();
```

### Filtering and Sorting

Prisma Client 支持使用 `where` 查询选项进行过滤，并使用 `orderBy` 查询选项进行排序。

#### 过滤（Filtering）

Prisma Client 允许您根据模型字段的任意组合（包括相关模型）过滤记录，并支持多种过滤条件。

##### 过滤条件和运算符 ​

请参阅 Prisma Client 的[参考文档](https://www.prisma.io/docs/orm/reference/prisma-client-reference#filter-conditions-and-operators)以获取运算符的完整列表，例如 startsWith 和 contains。

##### 组合运算符 ​

您可以使用运算符（例如 `NOT` 和 `OR` ）按条件组合进行过滤。以下查询返回电子邮件以“prisma.io”或“gmail.com”结尾但不以“hotmail.com”结尾的所有用户：

```ts
const result = await prisma.user.findMany({
  where: {
    OR: [
      {
        email: {
          endsWith: "prisma.io",
        },
      },
      { email: { endsWith: "gmail.com" } },
    ],
    NOT: {
      email: {
        endsWith: "hotmail.com",
      },
    },
  },
  select: {
    email: true,
  },
});
```

##### 过滤空字段 ​

以下查询返回内容字段为 `null` 的所有帖子：

```ts
const posts = await prisma.post.findMany({
  where: {
    content: null,
  },
});
```

##### 过滤非空字段 ​

以下查询返回内容字段不为空的所有帖子：

```ts
const posts = await prisma.post.findMany({
  where: {
    content: { not: null },
  },
});
```

##### 过滤关系 ​

Prisma Client 支持对相关记录进行过滤。例如，在以下架构中，用户可以拥有许多博客文章：
用户和帖子之间的一对多关系允许您根据帖子查询用户 - 例如，以下查询返回至少一个帖子（某些）具有超过 10 次浏览的所有用户：

```ts
const result = await prisma.user.findMany({
  where: {
    posts: {
      some: {
        views: {
          gt: 10,
        },
      },
    },
  },
});
```

您还可以根据作者的属性查询帖子。例如，以下查询返回作者电子邮件包含“prisma.io”的所有帖子：

```ts
const res = await prisma.post.findMany({
  where: {
    author: {
      email: {
        contains: "prisma.io",
      },
    },
  },
});
```

##### 对标量列表/数组进行过滤 ​

标量列表（例如，String[]）具有一组特殊的[过滤条件](https://www.prisma.io/docs/orm/reference/prisma-client-reference#scalar-list-filters) - 例如，以下查询返回标签数组包含数据库的所有帖子：

```ts
const posts = await client.post.findMany({
  where: {
    tags: {
      has: "databases",
    },
  },
});
```

##### 不区分大小写的过滤 ​

不区分大小写的过滤可作为 **PostgreSQL** 和 **MongoDB** 提供商的一项功能。 MySQL、MariaDB 和 Microsoft SQL Server 默认情况下不区分大小写，并且不需要 Prisma 客户端功能即可实现不区分大小写的过滤。
要使用不区分大小写的过滤，请将 `mode` 属性添加到特定过滤器并指定不敏感：

```ts
const users = await prisma.user.findMany({
  where: {
    email: {
      endsWith: "prisma.io",
      mode: "insensitive", // Default value: default
    },
    name: {
      equals: "Archibald", // Default mode
    },
  },
});
```

另请参阅：[区分大小写](#case-sensitivity)

##### 过滤常见问题解答 ​

###### 数据库级别的过滤如何工作？

对于 MySQL 和 PostgreSQL，Prisma 客户端利用 `LIKE`（和 `ILIKE`）运算符来搜索给定模式。运算符具有使用 `LIKE` 特有符号的内置模式匹配。模式匹配符号包括 `%` 表示零个或多个字符（类似于其他正则表达式实现中的 `*`）和 `_` 表示一个字符（类似于 `.`）

要匹配文字字符 % 或 \_，请确保对这些字符进行转义。例如：

```ts
const users = await prisma.user.findMany({
  where: {
    name: {
      startsWith: "_benny",
    },
  },
});
```

上面的查询将匹配名称以字符开头后跟 benny 的任何用户，例如 7benny 或 &benny。如果您想查找名称以文字字符串 \_benny 开头的任何用户，您可以这样做：

```ts
const users = await prisma.user.findMany({
  where: {
    name: {
      startsWith: "\\_benny", // note that the `_` character is escaped, preceding `\` with `\` when included in a string
    },
  },
});
```

#### 排序（Sorting）

使用 `orderBy` 按特定字段或字段集对记录列表或嵌套记录列表进行排序。例如，以下查询返回按角色和名称排序的所有用户记录，以及按标题排序的每个用户的帖子：

```ts
const usersWithPosts = await prisma.user.findMany({
  orderBy: [
    {
      role: "desc",
    },
    {
      name: "desc",
    },
  ],
  include: {
    posts: {
      orderBy: {
        title: "desc",
      },
      select: {
        title: true,
      },
    },
  },
});
```

##### 按关系排序 ​

您还可以按关系的属性进行排序。例如，以下查询按作者的电子邮件地址对所有帖子进行排序：

```ts
const posts = await prisma.post.findMany({
  orderBy: {
    author: {
      email: "asc",
    },
  },
});
```

##### 按关系聚合值排序 ​

您可以按相关记录的计数进行排序。例如，以下查询按相关帖子的数量对用户进行排序：

```ts
const getActiveUsers = await prisma.user.findMany({
  take: 10,
  orderBy: {
    posts: {
      _count: "desc",
    },
  },
});
```

##### 按相关性排序（PostgreSQL 和 MySQL）​

在 PostgreSQL 3.5.0+ 和 MySQL 3.8.0+ 中，您可以使用 `_relevance` 关键字按与查询的相关性对记录进行排序。这使用全文搜索功能的相关性排名功能。
[PostgreSQL 文档](https://www.postgresql.org/docs/12/textsearch-controls.html) 和 [MySQL 文档](https://dev.mysql.com/doc/refman/8.0/en/fulltext-search.html) 中进一步解释了此功能。
使用 `fullTextSearch` 预览功能启用按相关性排序：

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["fullTextSearch"]
}
```

按相关性排序可以单独使用或与搜索过滤器一起使用：`_relevance` 用于对列表进行排序，而搜索则过滤无序列表。
例如，以下查询使用 `_relevance` 按 bio 字段中的术语 developer 进行过滤，然后按相关性升序对结果进行排序：

```ts
const getUsersByRelevance = await prisma.user.findMany({
  take: 10,
  orderBy: {
    _relevance: {
      fields: ["bio"],
      search: "developer",
      sort: "asc",
    },
  },
});
```

##### 首先或最后以空记录排序 ​

您可以对结果进行排序，以便具有空字段的记录出现在最前面或最后。

- 此功能**不适用于 MongoDB**。
- 您只能按**可选标量字段**上的空值进行排序。如果您尝试按必填字段或关系字段上的空值进行排序，Prisma 客户端会抛出 P2009 错误。

如果 name 是可选字段，则以下查询使用 `last` 按名称对用户进行排序，末尾为空记录：

```ts
const users = await prisma.user.findMany({
  orderBy: {
    updatedAt: { sort: "asc", nulls: "last" },
  },
});
```

如果您希望具有空值的记录出现在返回数组的开头，请首先使用：

```ts
const users = await prisma.user.findMany({
  orderBy: {
    updatedAt: { sort: "asc", nulls: "first" },
  },
});
```

请注意，`first` 也是默认值，因此如果省略 `null` 选项，则 `null` 值将首先出现在返回的数组中。

##### 排序常见问题解答 ​

- [我可以执行不区分大小写的排序吗？​](https://github.com/prisma/prisma-client-js/issues/841)

### Pagination

Prisma Client 支持偏移分页和基于光标的分页。

#### 偏移分页

偏移分页使用 `skip` 和 `take` 来跳过一定数量的结果并选择有限的范围。
以下查询跳过前 3 个 Post 记录并返回记录 4 - 7：

```ts
const results = await prisma.post.findMany({
  skip: 3,
  take: 4,
});
```

##### 偏移分页的优点 ​

- 您可以立即跳转到任何页面。
- 您可以按任何排序顺序对同一结果集进行分页。

##### 偏移分页的缺点 ​

- 偏移分页不会在数据库级别扩展。

##### 偏移分页的用例 ​

- 小结果集的浅分页。

##### 示例：过滤和偏移分页 ​

以下查询返回电子邮件字段包含 prisma.io 的所有记录。该查询跳过前 40 条记录并返回记录 41 - 50。

```ts
const results = await prisma.post.findMany({
  skip: 40,
  take: 10,
  where: {
    email: {
      contains: "prisma.io",
    },
  },
});
```

##### 示例：排序和偏移分页 ​

以下查询返回电子邮件字段包含 Prisma 的所有记录，并按标题字段对结果进行排序。该查询跳过前 200 条记录并返回记录 201 - 220。

```ts
const results = await prisma.post.findMany({
  skip: 200,
  take: 20,
  where: {
    email: {
      contains: "Prisma",
    },
  },
  orderBy: {
    title: "desc",
  },
});
```

#### 基于游标的分页

基于游标的分页使用游标和 `take` 在给定游标之前或之后返回一组有限的结果。游标为您在结果集中的位置添加书签，并且必须是唯一的连续列 - 例如 ID 或时间戳。

以下示例返回前 4 条包含单词“Prisma”的 Post 记录，并将最后一条记录的 ID 保存为 myCursor：
**_注意_**：由于这是第一个查询，因此没有要传入的游标。

```ts
const firstQueryResults = await prisma.post.findMany({
  take: 4,
  where: {
    title: {
      contains: "Prisma" /* Optional filter */,
    },
  },
  orderBy: {
    id: "asc",
  },
});

// Bookmark your location in the result set - in this
// case, the ID of the last post in the list of 4.

const lastPostInResults = firstQueryResults[3]; // Remember: zero-based index! :)
const myCursor = lastPostInResults.id; // Example: 29
```

第二个查询返回在提供的光标之后包含单词“Prisma”的前 4 个 Post 记录（换句话说 - 大于 29 的 ID）：

```ts
const secondQueryResults = await prisma.post.findMany({
  take: 4,
  skip: 1, // Skip the cursor
  cursor: {
    id: myCursor,
  },
  where: {
    title: {
      contains: "Prisma" /* Optional filter */,
    },
  },
  orderBy: {
    id: "asc",
  },
});

const lastPostInResults = secondQueryResults[3]; // Remember: zero-based index! :)
const myCursor = lastPostInResults.id; // Example: 52
```

![](./assets/cursor-2.png)

##### 常见问题

###### 我是否总是必须 skip：1？​

如果您不跳过：1，您的结果集将包括您之前的光标。第一个查询返回 4 个结果，游标为 29,
如果没有 skip:1，第二个查询将在光标之后（包括）返回 4 个结果,
如果跳过：1，则不包括光标,
您可以选择跳过：1 或不跳过，具体取决于您想要的分页行为。

###### 我能猜出光标的值吗？​

如果您猜测下一个光标的值，您将分页到结果集中的未知位置。尽管 ID 是连续的，但您无法预测增量速率（2、20、32 比 1、2、3 更有可能，特别是在筛选的结果集中）。

###### 基于游标的分页是否使用底层数据库中游标的概念？​

不，游标分页不使用底层数据库中的游标（例如 PostgreSQL）。

###### 如果光标值不存在会发生什么？​

使用不存在的游标将返回 null。 Prisma 客户端不会尝试查找相邻值。

##### 基于游标的分页的优点

基于光标的分页比例。底层 SQL 不使用 OFFSET，而是查询所有 ID 大于 cursor 值的 Post 记录。

##### 基于游标的分页的缺点

您必须按光标排序，光标必须是唯一的连续列。
仅使用光标无法跳转到特定页面。例如，如果不首先请求页面 1 - 399，则无法准确预测哪个光标表示第 400 页（页面大小 20）的开头。

##### 基于游标的分页的用例

- 无限滚动 - 例如，按日期/时间降序对博客文章进行排序，并一次请求 10 篇博客文章。
- 批量分页整个结果集 - 例如，作为长期运行的数据导出的一部分。

##### 示例：过滤和基于游标的分页

```ts
const secondQuery = await prisma.post.findMany({
  take: 4,
  cursor: {
    id: myCursor,
  },
  where: {
    title: {
      contains: "Prisma" /* Optional filter */,
    },
  },
  orderBy: {
    id: "asc",
  },
});
```

##### 排序和基于游标的分页

基于游标的分页要求您按顺序、唯一的列（例如 ID 或时间戳）进行排序。该值（称为游标）为您在结果集中的位置添加书签，并允许您请求下一组。

##### 示例：使用基于游标的分页向后分页

要向后翻页，请将 take 设置为负值。以下查询返回 4 条 id 小于 200 的 Post 记录（不包括游标）：

```ts
const myOldCursor = 200;

const firstQueryResults = await prisma.post.findMany({
  take: -4,
  skip: 1,
  cursor: {
    id: myOldCursor,
  },
  where: {
    title: {
      contains: "Prisma" /* Optional filter */,
    },
  },
  orderBy: {
    id: "asc",
  },
});
```

### Aggregation,grouping,and summarizing

Prisma 客户端允许您对记录进行计数、聚合数字字段并选择不同的字段值。

#### Aggregation(聚合)

Prisma Client 允许您聚合模型的数字字段（例如 `Int` 和 `Float`）。
以下查询返回所有用户的平均年龄：

```ts
const aggregations = await prisma.user.aggregate({
  _avg: {
    age: true,
  },
});

console.log("Average age:" + aggregations._avg.age);
```

您可以将聚合与过滤和排序结合起来。例如，以下查询返回用户的平均年龄：

```ts
const aggregations = await prisma.user.aggregate({
  _avg: {
    age: true,
  },
  where: {
    email: {
      contains: "prisma.io",
    },
  },
  orderBy: {
    age: "asc",
  },
  take: 10,
});

console.log("Average age:" + aggregations._avg.age);
```

##### 聚合值可以为空 ​

可为空字段的聚合可以返回数字或 `null`。这不包括 `count`，如果未找到记录，则始终返回 0。

```ts
const aggregations = await prisma.user.aggregate({
  _avg: {
    age: true,
  },
  _count: {
    age: true,
  },
});

// {
//   _avg: {
//     age: null
//   },
//   _count: {
//     age: 9
//   }
// }
```

在以下任一情况下，查询返回 { \_avg: { Age: null } }：

- 没有用户
- 每个用户的年龄字段值为空
  这使您可以区分真实聚合值（可能为零）和无数据。

#### Group by(分组)

Prisma Client 的 `groupBy()` 允许您按一个或多个字段值（例如国家或国家和城市）对记录进行分组，并对每个组执行聚合，例如查找居住在特定城市的人们的平均年龄。
以下示例按国家/地区字段对所有用户进行分组，并返回每个国家/地区的个人资料查看总数：

```ts
const groupUsers = await prisma.user.groupBy({
  by: ["country"],
  _sum: {
    profileViews: true,
  },
});

// [
//   { country: 'Germany', _sum: { profileViews: 126 } },
//   { country: 'Sweden', _sum: { profileViews: 0 } },
// ]
```

如果 `by` 选项中有单个元素，则可以使用以下简写语法来表达查询：

```ts
const groupUsers = await prisma.user.groupBy({
  by: "country",
});
```

##### groupBy() 和过滤 ​

`groupBy()` 支持两个级别的过滤：`where` 和`having`。

###### 使用 where 过滤记录 ​

分组前使用`where`过滤所有记录。
以下示例按国家/地区和汇总个人资料视图对用户进行分组，但仅包括电子邮件地址包含 prisma.io 的用户：

```ts
const groupUsers = await prisma.user.groupBy({
  by: ["country"],
  where: {
    email: {
      contains: "prisma.io",
    },
  },
  _sum: {
    profileViews: true,
  },
});
```

###### 使用 having 过滤组

`having` 必须按**聚合值**（例如字段的总和或平均值）而不是单个记录来过滤整个组
例如，仅返回平均 profileViews 大于 100 的组：

```ts
const groupUsers = await prisma.user.groupBy({
  by: ["country"],
  where: {
    email: {
      contains: "prisma.io",
    },
  },
  _sum: {
    profileViews: true,
  },
  having: {
    profileViews: {
      _avg: {
        gt: 100,
      },
    },
  },
});
```

###### 使用 having 的用例

`having`的主要用例是过滤聚合。
我们建议您在分组之前使用 `where` 来尽可能减小数据集的大小，因为这样做可以减少数据库必须返回的记录数，并且可以利用索引。
例如，以下查询对非瑞典或加纳的所有用户进行分组：

```ts
const fd = await prisma.user.groupBy({
  by: ["country"],
  where: {
    country: {
      notIn: ["Sweden", "Ghana"],
    },
  },
  _sum: {
    profileViews: true,
  },
  having: {
    profileViews: {
      _min: {
        gte: 10,
      },
    },
  },
});
```

以下查询在技术上实现了相同的结果，但在分组后排除了来自加纳的用户。这不会带来任何好处，也不推荐这样做。

```ts
const groupUsers = await prisma.user.groupBy({
  by: ["country"],
  where: {
    country: {
      not: "Sweden",
    },
  },
  _sum: {
    profileViews: true,
  },
  having: {
    country: {
      not: "Ghana",
    },
    profileViews: {
      _min: {
        gte: 10,
      },
    },
  },
});
```

##### groupBy() 和排序 ​

当组合 `groupBy()` 和 `orderBy` 时，以下约束适用：

- 您可以 `orderBy`,`by` 中存在的字段
- 您可以`orderBy`聚合
- 如果您将`skip`和`take`与`groupBy()`一起使用，则还必须在查询中包含`orderBy`

##### 按聚合组排序 ​

您可以按聚合组订购。
以下示例按每个城市组中的用户数量对该组进行排序（最大的组在前）：

```ts
const groupBy = await prisma.user.groupBy({
  by: ["city"],
  _count: {
    city: true,
  },
  orderBy: {
    _count: {
      city: "desc",
    },
  },
});
```

##### 按字段排序 ​

以下查询按国家/地区对组进行排序，跳过前两组，并返回第三组和第四组：

```ts
const groupBy = await prisma.user.groupBy({
  by: ["country"],
  _sum: {
    profileViews: true,
  },
  orderBy: {
    country: "desc",
  },
  skip: 2,
  take: 2,
});
```

##### groupBy() 常见问题解答 ​

###### 我可以将 `select` 与 `groupBy()` 一起使用吗？​

您不能将 `select` 与` groupBy()` 一起使用。但是，`by` 中包含的所有字段都会自动返回。

###### 在 `groupBy()` 中使用 `where` 和 `having` 有什么区别？​

`where` 在分组之前过滤所有记录，`having` 过滤整个组并支持对聚合字段值进行过滤，例如该组中特定字段的平均值或总和。

###### `groupBy()` 和 `distinct` 之间有什么区别？​

`distinct` 和 `groupBy()` 都按一个或多个唯一字段值对记录进行分组。 `groupBy()` 允许您聚合每个组内的数据 - 例如，返回来自丹麦的帖子的平均浏览量 - 而 `distinct` 则不能。

#### Count(计数)

##### 计数记录 ​

使用 `count()` 来统计记录或非空字段值的数量。以下示例查询对所有用户进行计数：

```ts
const userCount = await prisma.user.count();
```

##### 计数关系 ​

要返回关系计数（例如，用户的帖子计数），请使用 `_count` 参数和嵌套选择，如下所示：

```ts
const usersWithCount = await prisma.user.findMany({
  include: {
    _count: {
      select: { posts: true },
    },
  },
});
```

`_count`参数：

- 可以在顶级`include`或`select`内部使用
- 可与任何返回记录的查询一起使用（包括`delete`、`update`和 `findFirst`）
- 可以返回多个关系计数
- 可以过滤关系计数

###### 使用 `include` 返回关系计数

以下查询在结果中包含每个用户的帖子计数：

```ts
const usersWithCount = await prisma.user.findMany({
  include: {
    _count: {
      select: { posts: true },
    },
  },
});
```

###### 使用 `select` 返回关系计数 ​

以下查询使用 `select` 返回每个用户的帖子计数，不返回其他字段：

```ts
const usersWithCount = await prisma.user.findMany({
  select: {
    _count: {
      select: { posts: true },
    },
  },
});
```

###### 返回多个关系计数 ​

以下查询返回每个用户的帖子和食谱的计数，不返回其他字段：

```ts
const usersWithCount = await prisma.user.findMany({
  select: {
    _count: {
      select: {
        posts: true,
        recipes: true,
      },
    },
  },
});
```

###### 过滤关系计数 ​

使用 `where` 来过滤 `_count` 输出类型返回的字段。您可以对*标量字段*、*关系字段*和*复合类型字段*执行此操作。
例如，以下查询返回标题为“Hello!”的所有用户帖子：

```ts
// Count all user posts with the title "Hello!"
await prisma.user.findMany({
  select: {
    _count: {
      select: {
        posts: { where: { title: "Hello!" } },
      },
    },
  },
});
```

以下查询查找包含来自名为“Alice”的作者的评论的所有用户帖子：

```ts
// Count all user posts that have comments
// whose author is named "Alice"
await prisma.user.findMany({
  select: {
    _count: {
      select: {
        posts: {
          where: { comments: { some: { author: { is: { name: "Alice" } } } } },
        },
      },
    },
  },
});
```

###### 计算非空字段值 ​

您可以对所有记录以及非空字段值的所有实例进行计数。
以下查询返回计数：

- 所有用户记录 (`_all`)
- 所有非空名称值（不是不同的值，只是不为空的值）

```ts
const userCount = await prisma.user.count({
  select: {
    _all: true, // Count all records
    name: true, // Count all non-null field values
  },
});
```

###### 过滤计数 ​

`count` 支持过滤。以下示例查询对拥有超过 100 个个人资料视图的所有用户进行计数：

```ts
const userCount = await prisma.user.count({
  where: {
    profileViews: {
      gte: 100,
    },
  },
});
```

以下示例查询对特定用户的帖子进行计数：

```ts
const postCount = await prisma.post.count({
  where: {
    authorId: 29,
  },
});
```

##### Select distinct

Prisma 客户端允许您使用 `distinct` 过滤从 Prisma 查询响应到 `findMany` 查询的重复行。 `distinct` 通常与 `select` 结合使用，以识别表行中某些唯一的值组合。
以下示例返回具有不同名称字段值的所有用户记录的所有字段：

```ts
const result = await prisma.user.findMany({
  where: {},
  distinct: ["name"],
});
```

以下示例返回不同的角色字段值（例如 ADMIN 和 USER）：

```ts
const distinctRoles = await prisma.user.findMany({
  distinct: ["role"],
  select: {
    role: true,
  },
});
```

###### [distinct under the hood](https://www.prisma.io/docs/orm/prisma-client/queries/aggregation-grouping-summarizing#distinct-under-the-hood)

### Transactions and batch queries

数据库事务是指保证整体成功或失败的一系列读/写操作。
开发人员通过将操作包装在事务中来利用数据库提供的安全保证。

Prisma Client 支持六种不同的交易处理方式，适用于三种不同的场景：
| Scenario | Available techniques |
| ------------------- | -------------------------------------------------------------------------------------------------------- |
| Dependent writes | Nested writes |
| Independent writes | <li> `$transaction([])` API </li> <li> Batch operations</li> |
| Read, modify, write | <li>Idempotent operations</li> <li>Optimistic concurrency control</li> <li>Interactive transactions</li> |

您选择的技术取决于您的特定用例。

#### 关于 Prisma 客户端中的交易

Prisma 客户端提供以下使用事务的选项：

- 嵌套写入：使用 Prisma 客户端 API 处理同一事务中一条或多条相关记录的多个操作。
- Batch/bulk 事务：使用 `updateMany`、`deleteMany` 和 `createMany` 批量处理一个或多个操作。
- The `$transaction` API in Prisma Client：
  - 顺序操作：使用 `$transaction<R>(queries: PrismaPromise<R>[]): Promise<R[]>` 传递要在事务内顺序执行的 Prisma Client 查询数组。
  - 交互式事务：传递一个函数，该函数可以包含用户代码，包括 Prisma 客户端查询、非 Prisma 代码和要在事务中执行的其他控制流，使用 `$transaction<R>(fn: (prisma: PrismaClient) => R, options ?: object): R`

#### 嵌套写入

嵌套写入允许您执行单个 Prisma 客户端 API 调用，其中包含涉及多个相关记录的多个操作。
例如，与帖子一起创建用户或与发票一起更新订单。 Prisma 客户端确保所有操作整体成功或失败。

以下示例演示了使用 create 进行嵌套写入：

```ts
// Create a new user with two posts in a
// single transaction
const newUser: User = await prisma.user.create({
  data: {
    email: "alice@prisma.io",
    posts: {
      create: [
        { title: "Join the Prisma Discord at https://pris.ly/discord" },
        { title: "Follow @prisma on Twitter" },
      ],
    },
  },
});
```

以下示例演示了带更新的嵌套写入：

```ts
// Change the author of a post in a single transaction
const updatedPost: Post = await prisma.post.update({
  where: { id: 42 },
  data: {
    author: {
      connect: { email: "alice@prisma.io" },
    },
  },
});
```

#### [Batch/bulk operations](https://www.prisma.io/docs/orm/prisma-client/queries/transactions#bulk-operations)

- deleteMany()
- updateMany()
- createMany()
- createManyAndReturn()

#### The `$transaction` API

`$transaction` API 可以通过两种方式使用：

- 顺序操作：传递要在事务内顺序执行的 Prisma 客户端查询数组。
- 交互式交易：传递一个可以包含用户代码的函数，包括 Prisma 客户端查询、非 Prisma 代码和要在交易中执行的其他控制流。

##### 顺序 Prisma 客户端操作

以下查询返回与所提供的过滤器匹配的所有帖子以及所有帖子的计数：

```ts
const [posts, totalPosts] = await prisma.$transaction([
  prisma.post.findMany({ where: { title: { contains: "prisma" } } }),
  prisma.post.count(),
]);
```

您还可以在 `$transaction` 中使用原始查询：

```ts
import { selectUserTitles, updateUserName } from "@prisma/client/sql";

const [userList, updateUser] = await prisma.$transaction([
  prisma.$queryRawTyped(selectUserTitles()),
  prisma.$queryRawTyped(updateUserName(2)),
]);
```

操作本身不是在执行时立即等待每个操作的结果，而是首先将其存储在变量中，然后使用名为 $transaction 的方法将其提交到数据库。 Prisma 客户端将确保所有三个创建操作都成功或都不成功。

从版本 4.4.0 开始，顺序操作事务 API 有第二个参数。您可以在此参数中使用以下可选配置选项：

- isolationLevel：设置事务隔离级别。默认情况下，该值设置为数据库中当前配置的值。

```ts
await prisma.$transaction(
  [
    prisma.resource.deleteMany({ where: { name: "name" } }),
    prisma.resource.createMany({ data }),
  ],
  {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable, // optional, default defined by database configuration
  }
);
```

##### 互动交易

有时您需要更多地控制事务中执行的查询。交互式交易旨在为您提供逃生舱口。

要使用交互式事务，您可以将异步函数传递到 $transaction 中。
传递到该异步函数的第一个参数是 Prisma Client 的实例。下面，我们将该实例称为 tx。在此 tx 实例上调用的任何 Prisma 客户端调用都会封装到事务中。
**warning:** _谨慎使用交互式交易。长时间保持事务打开会损害数据库性能，甚至可能导致死锁。尽量避免在事务函数内执行网络请求和执行缓慢的查询。我们建议您尽快进出！_

要捕获异常，您可以将 `$transaction` 包装在 `try-catch` 块中：

```ts
try {
  await prisma.$transaction(async (tx) => {
    // Code running in a transaction...
  });
} catch (err) {
  // Handle the rollback...
}
```

###### 交易选项

交易 API 有第二个参数。对于交互式事务，您可以在此参数中使用以下可选配置选项：

- `maxWait`：Prisma 客户端等待从数据库获取事务的最长时间。默认值为 2 秒。
- `timeout`：交互式事务在被取消和回滚之前可以运行的最长时间。默认值为 5 秒。
- `isolationLevel`：设置事务隔离级别。默认情况下，该值设置为数据库中当前配置的值。

```ts
await prisma.$transaction(
  async (tx) => {
    // Code running in a transaction...
  },
  {
    maxWait: 5000, // default: 2000
    timeout: 10000, // default: 5000
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable, // optional, default defined by database configuration
  }
);
```

您还可以在构造函数级别全局设置这些：

```ts
const prisma = new PrismaClient({
  transactionOptions: {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    maxWait: 5000, // default: 2000
    timeout: 10000, // default: 5000
  },
});
```

##### 事务隔离级别 ​

您可以为事务设置事务隔离级别。

**INFO**：_此功能在 MongoDB 上不可用，因为 MongoDB 不支持隔离级别。_

###### 设置隔离级别 ​

要设置事务隔离级别，请使用 API 的第二个参数中的 `isolationLevel` 选项。

- 对于顺序操作：

```ts
await prisma.$transaction(
  [
    // Prisma Client operations running in a transaction...
  ],
  {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable, // optional, default defined by database configuration
  }
);
```

- 对于交互式交易：

```ts
await prisma.$transaction(
  async (prisma) => {
    // Code running in a transaction...
  },
  {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable, // optional, default defined by database configuration
    maxWait: 5000, // default: 2000
    timeout: 10000, // default: 5000
  }
);
```

###### 支持的隔离级别 ​

Prisma Client 支持以下隔离级别（如果底层数据库中可用）：

- ReadUncommitted
- ReadCommitted
- RepeatableRead
- Snapshot
- Serializable

每个数据库连接器可用的隔离级别如下：

| Database    | ReadUncommitted | ReadCommitted | RepeatableRead | Snapshot | Serializable |
| ----------- | --------------- | ------------- | -------------- | -------- | ------------ |
| PostgreSQL  | ✔️              | ✔️            | ✔️             | No       | ✔️           |
| MySQL       | ✔️              | ✔️            | ✔️             | No       | ✔️           |
| SQL Server  | ✔️              | ✔️            | ✔️             | ✔️       | ✔️           |
| CockroachDB | No              | No            | No             | No       | ✔️           |
| SQLite      | No              | No            | No             | No       | ✔️           |

默认情况下，Prisma 客户端将隔离级别设置为数据库中当前配置的值。

每个数据库默认配置的隔离级别如下：

| Database    | Default        |
| ----------- | -------------- |
| PostgreSQL  | ReadCommitted  |
| MySQL       | RepeatableRead |
| SQL Server  | ReadCommitted  |
| CockroachDB | Serializable   |
| SQLite      | Serializable   |

##### 交易时间问题 ​ ​

**INFO：**

- 本节中的解决方案不适用于 MongoDB，因为 MongoDB 不支持隔离级别。
- 本节讨论的时序问题不适用于 CockroachDB 和 SQLite，因为这些数据库仅支持最高的 Serialized 隔离级别。

当两个或多个事务在某些隔离级别下并发运行时，计时问题可能会导致写入冲突或死锁，例如违反唯一约束。例如，考虑以下事件序列，其中事务 A 和事务 B 都尝试执行 `deleteMany` 和 `createMany` 操作：

1. 事务 B：createMany 操作创建一组新的行。
2. 事务 B：应用程序提交事务 B。
3. 事务 A：createMany 操作。
4. 事务 A：应用程序提交事务 A。新行与事务 B 在步骤 2 添加的行冲突。

这种冲突可能发生在隔离级别 ReadCommited 上，这是 PostgreSQL 和 Microsoft SQL Server 中的默认隔离级别。为了避免这个问题，可以设置更高的隔离级别（RepeatableRead 或 Serialized）。您可以设置事务的隔离级别。这会覆盖该事务的数据库隔离级别。

为了避免事务写入冲突和事务死锁：

1. 在您的事务中，使用 Prisma.TransactionIsolationLevel.Serialized 的隔离级别参数。
   这可确保您的应用程序提交多个并发或并行事务，就像它们串行运行一样。当事务由于写入冲突或死锁而失败时，Prisma 客户端会返回 P2034 错误。
2. 在您的应用程序代码中，在事务周围添加重试以处理任何 P2034 错误，如本示例所示：

```ts
import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
async function main() {
  const MAX_RETRIES = 5;
  let retries = 0;

  let result;
  while (retries < MAX_RETRIES) {
    try {
      result = await prisma.$transaction(
        [
          prisma.user.deleteMany({
            where: {
              /** args */
            },
          }),
          prisma.post.createMany({
            data: {
              /** args */
            },
          }),
        ],
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        }
      );
      break;
    } catch (error) {
      if (error.code === "P2034") {
        retries++;
        continue;
      }
      throw error;
    }
  }
}
```

##### 在 `Promise.all()` 中使用 `$transaction​`

如果您将 `$transaction` 包装在对 `Promise.all()` 的调用中，则事务中的查询将**串行执行**（即一个接一个）：

```ts
await prisma.$transaction(async (prisma) => {
  await Promise.all([
    prisma.user.findMany(),
    prisma.user.findMany(),
    prisma.user.findMany(),
    prisma.user.findMany(),
    prisma.user.findMany(),
    prisma.user.findMany(),
    prisma.user.findMany(),
    prisma.user.findMany(),
    prisma.user.findMany(),
    prisma.user.findMany(),
  ]);
});
```

这可能是违反直觉的，因为 Promise.all() 通常会并行化传递给它的调用。
这种行为的原因是：

- 一个事务意味着其中的所有查询都必须在同一连接上运行。
- 一个数据库连接一次只能执行一个查询。
- 由于一个查询在执行工作时会阻塞连接，因此将事务放入 Promise.all 中实际上意味着查询应该一个接一个地运行。

#### 依赖写入 ​

在以下情况下，写入被视为相互依赖：

- 操作取决于前面操作的结果（例如，数据库生成 ID）

最常见的场景是创建记录并使用生成的 ID 创建或更新相关记录。示例包括：

- 创建一个用户和两个相关的博客文章（一对多关系） - 创建博客文章之前必须知道作者 ID
- 创建团队并分配成员（多对多关系） - 在分配成员之前必须知道团队 ID

相关写入必须同时成功，以保持数据一致性并防止意外行为，例如没有作者的博客文章或没有成员的团队。

##### 嵌套写入 ​

Prisma Client 针对依赖写入的解决方案是嵌套写入功能，该功能由 `create` 和 `update` 来支持。
以下嵌套写入创建一个用户和两篇博客文章：

```ts
const nestedWrite = await prisma.user.create({
  data: {
    email: "imani@prisma.io",
    posts: {
      create: [
        { title: "My first day at Prisma" },
        { title: "How to configure a unique constraint in PostgreSQL" },
      ],
    },
  },
});
```

如果任何操作失败，Prisma 客户端将回滚整个事务。 `client.user.deleteMany` 和 `client.user.updateMany` 等顶级批量操作当前不支持嵌套写入。

##### 何时使用嵌套写入 ​

如果出现以下情况，请考虑使用嵌套写入：

- 您想要同时创建两个或多个通过 ID 关联的记录（例如，创建博客文章和用户）
- 您想要同时更新和创建按 ID 相关的记录（例如，更改用户名并创建新的博客文章）

**TIP:**
_如果您预先计算 ID，则可以选择嵌套写入或使用 $transaction([]) API。_

##### [场景：注册流程 ​](https://www.prisma.io/docs/orm/prisma-client/queries/transactions#scenario-sign-up-flow)

##### 嵌套写入常见问题解答 ​

- 为什么我不能使用 $transaction([]) API 来解决同样的问题？​
`$transaction([])` API 不允许您在不同的操作之间传递 ID。在以下示例中，createUserOperation.id 尚不可用：

```ts
const createUserOperation = prisma.user.create({
  data: {
    email: "ebony@prisma.io",
  },
});

const createTeamOperation = prisma.team.create({
  data: {
    name: "Aurora Adventures",
    members: {
      connect: {
        id: createUserOperation.id, // Not possible, ID not yet available
      },
    },
  },
});

await prisma.$transaction([createUserOperation, createTeamOperation]);
```

- 嵌套写入支持嵌套更新，但更新不是依赖写入 - 我应该使用 $transaction([]) API 吗？​
  正确的说法是，因为您知道团队的 ID，所以您可以在 $transaction([]) 内独立更新团队及其团队成员。以下示例在 $transaction([]) 中执行这两个操作：

```ts
const updateTeam = prisma.team.update({
  where: {
    id: 1,
  },
  data: {
    name: "Aurora Adventures Ltd",
  },
});

const updateUsers = prisma.user.updateMany({
  where: {
    teams: {
      some: {
        id: 1,
      },
    },
    name: {
      equals: null,
    },
  },
  data: {
    name: "Unknown User",
  },
});

await prisma.$transaction([updateUsers, updateTeam]);
```

但是，您可以通过嵌套写入获得相同的结果：

```ts
const updateTeam = await prisma.team.update({
  where: {
    id: 1,
  },
  data: {
    name: "Aurora Adventures Ltd", // Update team name
    members: {
      updateMany: {
        // Update team members that do not have a name
        data: {
          name: "Unknown User",
        },
        where: {
          name: {
            equals: null,
          },
        },
      },
    },
  },
});
```

- 我可以执行多个嵌套写入 - 例如，创建两个新团队并分配用户吗？​
  是的，但这是场景和技术的组合：
  - 创建团队和分配用户是依赖写入 - 使用嵌套写入
  - 同时创建所有团队和用户是独立写入，因为团队/用户组合 #1 和团队/用户组合 #2 是不相关的写入 - 使用 $transaction([]) API

```ts
// Nested write
const createOne = prisma.team.create({
  data: {
    name: "Aurora Adventures",
    members: {
      create: {
        email: "alice@prisma.io",
      },
    },
  },
});

// Nested write
const createTwo = prisma.team.create({
  data: {
    name: "Cool Crew",
    members: {
      create: {
        email: "elsa@prisma.io",
      },
    },
  },
});

// $transaction([]) API
await prisma.$transaction([createTwo, createOne]);
```

#### 独立写入 ​

如果写入不依赖于先前操作的结果，则写入被视为独立。以下几组独立写入可以按任何顺序发生：

- 将订单列表的状态字段更新为“已发货”
- 将电子邮件列表标记为“已读”

根据您的要求，Prisma 客户端有四个选项来处理应该一起成功或一起失败的独立写入。

##### 批量操作 ​

批量写入允许您在单个事务中写入相同类型的多个记录 - 如果任何操作失败，Prisma 客户端将回滚整个事务。 Prisma 客户端目前支持：

- updateMany()
- deleteMany()
- createMany()
- createManyAndReturn()

###### 何时使用批量操作 ​

如果出现以下情况，请考虑将批量操作作为解决方案：

- 您想要更新一批相同类型的记录，例如一批电子邮件

###### [场景：将电子邮件标记为已读 ​](https://www.prisma.io/docs/orm/prisma-client/queries/transactions#scenario-marking-emails-as-read)

###### 我可以在批量操作中使用嵌套写入吗？​

否 - `updateMany` 和 `deleteMany` 目前都不支持嵌套写入。
例如，您不能删除多个团队及其所有成员（级联删除）：

```ts
await prisma.team.deleteMany({
  where: {
    id: {
      in: [2, 99, 2, 11],
    },
  },
  data: {
    members: {}, // Cannot access members here
  },
});
```

###### 我可以通过 $transaction([]) API 使用批量操作吗？​

是的 - 例如，您可以在 $transaction([]) 中包含多个 deleteMany 操作。

##### `$transaction([])` API

`$transaction([])` API 是独立写入的通用解决方案，允许您将多个操作作为单个原子操作运行 - 如果任何操作失败，Prisma 客户端将回滚整个事务。

还值得注意的是，操作是根据它们在事务中放置的顺序执行的。

```ts
await prisma.$transaction([iRunFirst, iRunSecond, iRunThird]);
```

随着 Prisma Client 的发展，`$transaction([])` API 的用例将越来越多地被更专业的批量操作（例如 `createMany`）和嵌套写入所取代。

###### 何时使用 `$transaction([])` API​

如果出现以下情况，请考虑使用 $transaction([]) API：

- 您想要更新包含不同类型记录（例如电子邮件和用户）的批次。这些记录不需要以任何方式相关。
- 您想要批量原始 SQL 查询 ($executeRaw) - 例如，对于 Prisma Client 尚不支持的功能。

###### [场景：隐私立法 ​](https://www.prisma.io/docs/orm/prisma-client/queries/transactions#scenario-privacy-legislation)

###### [场景：预先计算的 ID 和 $transaction([]) API​​](https://www.prisma.io/docs/orm/prisma-client/queries/transactions#scenario-pre-computed-ids-and-the-transaction-api)

#### Read, modify, write

在某些情况下，您可能需要执行自定义逻辑作为原子操作的一部分 - 也称为读取-修改-写入模式
以下是读取-修改-写入模式的示例：

- 从数据库读取一个值
- 运行一些逻辑来操纵该值（例如，联系外部 API）
- 将值写回数据库

所有操作都应该同时成功或失败，而不会对数据库进行不必要的更改，但您不一定需要使用实际的数据库事务。本指南的这一部分介绍了使用 Prisma Client 和读取-修改-写入模式的两种方法：

- 设计幂等 API
- 乐观并发控制

##### 幂等 API

幂等性是指多次运行具有相同参数的相同逻辑并获得相同结果的能力：无论运行该逻辑一次还是一千次，对数据库的影响都是相同的。例如：

- 非幂等性：在数据库中更新插入（更新或插入）电子邮件地址为“letoya@prisma.io”的用户。用户表不强制使用唯一的电子邮件地址。如果运行逻辑一次（创建一个用户）或十次（创建十个用户），对数据库的影响会有所不同。
- 幂等性：在数据库中更新插入（更新或插入）电子邮件地址为“letoya@prisma.io”的用户。用户表确实强制执行唯一的电子邮件地址。如果运行逻辑一次（创建一个用户）或十次（使用相同的输入更新现有用户），对数据库的影响是相同的。

幂等性是您可以并且应该尽可能积极地设计到您的应用程序中的东西。

###### 何时设计幂等 API​

您需要能够重试相同的逻辑，而不会在数据库中产生不需要的副作用

###### [场景：升级 Slack 团队 ​](https://www.prisma.io/docs/orm/prisma-client/queries/transactions#scenario-upgrading-a-slack-team)

##### 乐观并发控制

乐观并发控制 (OCC) 是一种用于处理不依赖于 🔒 锁定的单个实体上的并发操作的模型。相反，我们乐观地假设记录在读取和写入之间保持不变，并使用并发令牌（时间戳或版本字段）来检测记录的更改。

如果发生冲突（自您读取记录以来其他人已更改该记录），您将取消事务。根据您的情况，您可以：

- 重试交易（预订另一个电影院座位）
- 抛出错误（提醒用户他们将要覆盖其他人所做的更改)

###### 何时使用乐观并发控制 ​

- 您预计会有大量并发请求（多人预订电影院座位）
- 您预计这些并发请求之间的冲突很少

避免在具有大量并发请求的应用程序中出现锁定，可以使应用程序的负载弹性更强，总体上更具可扩展性。虽然锁定本质上并不是坏事，但在高并发环境中锁定可能会导致意想不到的后果 - 即使您锁定单个行，而且只锁定很短的时间。有关更多信息，请参阅：

- [Why ROWLOCK Hints Can Make Queries Slower and Blocking Worse in SQL Server](https://kendralittle.com/2016/02/04/why-rowlock-hints-can-make-queries-slower-and-blocking-worse-in-sql-server/)

###### [场景：在电影院预订座位 ​](https://www.prisma.io/docs/orm/prisma-client/queries/transactions#scenario-reserving-a-seat-at-the-cinema) ​

##### 互动交易 ​

如果您有一个现有的应用程序，那么重构您的应用程序以使用乐观并发控制可能是一项艰巨的任务。交互式交易为此类情况提供了一个有用的逃生口。
要创建交互式事务，请将异步函数传递到 $transaction 中。

### Full-text search

Prisma Client 支持 2.30.0 及更高版本的 PostgreSQL 数据库以及 3.8.0 及更高版本的 MySQL 数据库的全文搜索。启用全文搜索后，您可以通过在数据库列中搜索文本来向应用程序添加搜索功能。

**NOTE:**
_注意：全文搜索功能目前存在一个已知问题。如果您观察到搜索查询速度缓慢，则可以使用原始 SQL 优化查询。_

#### 启用全文搜索 ​

全文搜索 API 目前是预览功能。要启用此功能，请执行以下步骤：

1. 更新架构中的 `PreviewFeatures` 块以包含 `fullTextSearch` 预览功能标志：

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["fullTextSearch"]
}
```

对于 MySQL，您还需要包含 `fullTextIndex` 预览功能标志：

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "fullTextIndex"]
}
```

2. 生成 Prisma 客户端：

```cmd
npx prisma generate
```

重新生成客户端后，在模型上创建的任何字符串字段上都将提供新的搜索字段。例如，以下搜索将返回包含单词“cat”的所有帖子。

```ts
// All posts that contain the word 'cat'.
const result = await prisma.posts.findMany({
  where: {
    body: {
      search: "cat",
    },
  },
});
```

#### 查询数据库 ​

搜索字段在底层使用数据库的本机查询功能。这意味着可用的确切查询运算符也是特定于数据库的。
以下示例演示了 PostgreSQL 'and' (&) 和 'or' (|) 运算符的用法：

```ts
// All posts that contain the words 'cat' or 'dog'.
const result = await prisma.posts.findMany({
  where: {
    body: {
      search: "cat | dog",
    },
  },
});

// All drafts that contain the words 'cat' and 'dog'.
const result = await prisma.posts.findMany({
  where: {
    status: "Draft",
    body: {
      search: "cat & dog",
    },
  },
});
```

以下示例演示了 MySQL 'and' (+) 和 'not' (-) 运算符的使用：

```ts
// All posts that contain the words 'cat' or 'dog'.
const result = await prisma.posts.findMany({
  where: {
    body: {
      search: "cat dog",
    },
  },
});

// All posts that contain the words 'cat' and not 'dog'.
const result = await prisma.posts.findMany({
  where: {
    body: {
      search: "+cat -dog",
    },
  },
});

// All drafts that contain the words 'cat' and 'dog'.
const result = await prisma.posts.findMany({
  where: {
    status: "Draft",
    body: {
      search: "+cat +dog",
    },
  },
});
```

有关支持的全部操作，请[参阅 MySQL 全文搜索文档](https://dev.mysql.com/doc/refman/8.0/en/fulltext-boolean.html)。

#### 按相关性对结果进行排序

除了 Prisma Client 的默认 `orderBy` 行为之外，全文搜索还添加了按与给定字符串或字符串的相关性进行排序。
例如，如果您想根据帖子与标题中术语“数据库”的相关性对帖子进行排序，则可以使用以下命令：

```ts
const posts = await prisma.post.findMany({
  orderBy: {
    _relevance: {
      fields: ["title"],
      search: "database",
      sort: "asc",
    },
  },
});
```

#### 添加索引 ​

对于 PostgreSQL，Prisma Client 目前不支持使用索引来加速全文搜索。对此已有一个现有的 [GitHub Issue](https://github.com/prisma/prisma/issues/8950)

对于 MySQL，需要将索引添加到使用 schema.prisma 文件中的 @@fulltext 参数搜索的任何列。为此，必须启用“fullTextIndex”预览功能。
在以下示例中，一个全文索引添加到 Blog 模型的内容字段，另一个全文索引同时添加到内容和标题字段：

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "fullTextIndex"]
}

model Blog {
  id      Int    @unique
  content String
  title   String

  @@fulltext([content])
  @@fulltext([content, title])
}
```

第一个索引允许在内容字段中搜索单词“cat”的出现：

```ts
const result = await prisma.blogs.findMany({
  where: {
    content: {
      search: "cat",
    },
  },
});
```

第二个索引允许在内容和标题字段中搜索内容中出现的单词“cat”和标题中出现的“food”：

```ts
const result = await prisma.blogs.findMany({
  where: {
    content: {
      search: "cat",
    },
    title: {
      search: "food",
    },
  },
});
```

但是，如果您尝试仅搜索标题，则搜索将失败，并显示错误“无法找到用于搜索的全文索引”，并且消息代码为 P2030，因为搜索需要在两个字段上都有索引。

#### 使用原始 SQL 进行全文搜索 ​

全文搜索当前处于预览状态，由于已知问题，您可能会遇到搜索查询速度缓慢的情况。如果是这样，您可以使用 [TypedSQL](#typedsql) 优化查询。

##### [对于 PostgreSQL](https://www.prisma.io/docs/orm/prisma-client/queries/full-text-search#postgresql-2)

##### [对于 MySQL](https://www.prisma.io/docs/orm/prisma-client/queries/full-text-search#mysql-2)

### Custom validation

您可以通过以下方式之一为 Prisma 客户端查询的用户输入添加运行时验证：

- [Prisma Client extensions](https://www.prisma.io/docs/orm/prisma-client/client-extensions)
- 自定义函数

您可以使用任何您想要的验证库。 Node.js 生态系统提供了许多高质量、易于使用的验证库可供选择，包括：joi、validator.js、Yup、Zod 和 Superstruct。

#### 使用 Prisma 客户端扩展进行输入验证 ​

此示例在使用 Zod 架构创建和更新值时添加运行时验证，以检查传递到 Prisma 客户端的数据是否有效。

**WARNING：**
_查询扩展当前不适用于嵌套操作。_
_在此示例中，验证仅在传递给 prisma.product.create() 等方法的顶级数据对象上运行。以这种方式实现的验证不会自动运行嵌套写入。_

```ts
import { PrismaClient, Prisma } from "@prisma/client";
import { z } from "zod";

/**
 * Zod schema
 */
export const ProductCreateInput = z.object({
  slug: z
    .string()
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().max(100),
  description: z.string().max(1000),
  price: z
    .instanceof(Prisma.Decimal)
    .refine((price) => price.gte("0.01") && price.lt("1000000.00")),
}) satisfies z.Schema<Prisma.ProductUncheckedCreateInput>;

/**
 * Prisma Client Extension
 */
const prisma = new PrismaClient().$extends({
  query: {
    product: {
      create({ args, query }) {
        args.data = ProductCreateInput.parse(args.data);
        return query(args);
      },
      update({ args, query }) {
        args.data = ProductCreateInput.partial().parse(args.data);
        return query(args);
      },
      updateMany({ args, query }) {
        args.data = ProductCreateInput.partial().parse(args.data);
        return query(args);
      },
      upsert({ args, query }) {
        args.create = ProductCreateInput.parse(args.create);
        args.update = ProductCreateInput.partial().parse(args.update);
        return query(args);
      },
    },
  },
});

async function main() {
  /**
   * Example usage
   */
  // Valid product
  const product = await prisma.product.create({
    data: {
      slug: "example-product",
      name: "Example Product",
      description: "Lorem ipsum dolor sit amet",
      price: new Prisma.Decimal("10.95"),
    },
  });

  // Invalid product
  try {
    await prisma.product.create({
      data: {
        slug: "invalid-product",
        name: "Invalid Product",
        description: "Lorem ipsum dolor sit amet",
        price: new Prisma.Decimal("-1.00"),
      },
    });
  } catch (err: any) {
    console.log(err?.cause?.issues);
  }
}

main();
```

上面的示例使用 Zod 架构在将记录写入数据库之前在运行时验证和解析查询中提供的数据。

#### 使用自定义验证函数进行输入验证 ​​

以下是使用 Superstruct 验证注册新用户所需的数据是否正确的示例：

```ts
import { PrismaClient, Prisma, User } from "@prisma/client";
import { assert, object, string, size, refine } from "superstruct";
import isEmail from "isemail";

const prisma = new PrismaClient();

// Runtime validation
const Signup = object({
  // string and a valid email address
  email: refine(string(), "email", (v) => isEmail.validate(v)),
  // password is between 7 and 30 characters long
  password: size(string(), 7, 30),
  // first name is between 2 and 50 characters long
  firstName: size(string(), 2, 50),
  // last name is between 2 and 50 characters long
  lastName: size(string(), 2, 50),
});

type Signup = Omit<Prisma.UserCreateArgs["data"], "id">;

// Signup function
async function signup(input: Signup): Promise<User> {
  // Assert that input conforms to Signup, throwing with a helpful
  // error message if input is invalid.
  assert(input, Signup);
  return prisma.user.create({
    data: input.user,
  });
}
```

上面的示例展示了如何创建自定义类型安全注册函数，以确保在创建用户之前输入有效。

#### [Going further](https://www.prisma.io/docs/orm/prisma-client/queries/custom-validation#going-further)

### Computed fields

计算字段允许您根据现有数据派生新字段。
一个常见的例子是当您想要计算全名时。在数据库中，您可能只存储名字和姓氏，但您可以定义一个函数，通过组合名字和姓氏来计算全名。
计算字段是只读的，存储在应用程序的内存中，而不是数据库中。

#### 使用 Prisma 客户端扩展 ​

以下示例说明如何创建 Prisma 客户端扩展，该扩展在运行时将 fullName 计算字段添加到 Prisma 架构中的用户模型中。

```ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient().$extends({
  result: {
    user: {
      fullName: {
        needs: { firstName: true, lastName: true },
        compute(user) {
          return `${user.firstName} ${user.lastName}`;
        },
      },
    },
  },
});

async function main() {
  /**
   * Example query containing the `fullName` computed field in the response
   */
  const user = await prisma.user.findFirst();
}

main();
```

计算字段是类型安全的，可以返回从串联值到复杂对象或函数的任何内容，这些对象或函数可以充当模型的实例方法。

#### [Going further​](https://www.prisma.io/docs/orm/prisma-client/queries/computed-fields#going-further)

### Excluding fields

默认情况下，Prisma 客户端返回模型中的所有字段。您可以使用 select 来缩小结果集，但如果您有一个大型模型并且只想排除一两个字段，那么这可能会很麻烦。

**INFO：**
从 Prisma ORM 5.16.0 开始，通过 omitApi 预览功能支持全局和本地排除字段。

#### 使用 omit 全局排除字段 ​

以下是使用 omitApi 预览功能全局排除字段的类型安全方法：

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["omitApi"]
}

model User {
  id        Int      @id @default(autoincrement())
  firstName String
  lastName  String
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

```ts
const prisma = new PrismaClient({
  omit: {
    user: {
      password: true,
    },
  },
});

// The password field is excluded in all queries, including this one
const user = await prisma.user.findUnique({ where: { id: 1 } });
```

#### 使用 omit 本地排除字段 ​

以下是使用 omitApi 预览功能在本地排除字段的类型安全方法：

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["omitApi"]
}

model User {
  id        Int      @id @default(autoincrement())
  firstName String
  lastName  String
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

```ts
const prisma = new PrismaClient();

// The password field is excluded only in this query
const user = await prisma.user.findUnique({
  omit: {
    password: true,
  },
  where: {
    id: 1,
  },
});
```

#### 如何省略多个字段 ​

省略多个字段与选择多个字段的作用相同：将多个键值对添加到省略选项。使用与以前相同的架构，您可以通过以下方式省略密码和电子邮件：

```ts
const prisma = new PrismaClient();

// password and email are excluded
const user = await prisma.user.findUnique({
  omit: {
    email: true,
    password: true,
  },
  where: {
    id: 1,
  },
});
```

可以局部和全局省略多个字段。

#### 如何省略多个字段 ​

如果全局省略某个字段，则可以通过专门`select`该字段或在查询中将 `omit` 设置为 `false` 来“覆盖”。

```ts
// 使用 select 选择字段
const user = await prisma.user.findUnique({
  select: {
    firstName: true,
    lastName: true,
    password: true, // The password field is now selected.
  },
  where: {
    id: 1,
  },
});

// 设置 omit 为 false 来覆盖全局设置
const user = await prisma.user.findUnique({
  omit: {
    password: false, // The password field is now selected.
  },
  where: {
    id: 1,
  },
});
```

#### 何时在全局或本地使用省略 ​

了解何时全局或本地省略字段非常重要：

- 如果您为了防止意外包含在查询中而省略某个字段，则最好全局省略它。
  例如：从用户模型中全局省略密码字段，以便敏感信息不会意外暴露。
- 如果您因为查询中不需要而省略某个字段，则最好在本地省略它。
  本地省略（当查询中提供省略选项时）仅适用于定义它的查询，而全局省略适用于使用同一 Prisma 客户端实例进行的每个查询，除非使用特定选择或覆盖省略。

#### 不使用 omit 排除密码字段 ​

以下是类型安全排除函数返回不带密码字段的用户。

```ts
// Exclude keys from user
function exclude<User, Key extends keyof User>(
  user: User,
  keys: Key[]
): Omit<User, Key> {
  return Object.fromEntries(
    Object.entries(user).filter(([key]) => !keys.includes(key))
  );
}

function main() {
  const user = await prisma.user.findUnique({ where: 1 });
  const userWithoutPassword = exclude(user, ["password"]);
}
```

在 TypeScript 示例中，我们提供了两个泛型：User 和 Key。通用密钥定义为用户的密钥（例如电子邮件、密码、名字等）。
这些泛型在逻辑中流动，返回一个省略所提供的键列表的用户。

### Custom models

随着应用程序的增长，您可能会发现需要将相关逻辑组合在一起。我们建议：

- 使用 Prisma 客户端扩展创建静态方法
- 将模型包装在类中
- 扩展 Prisma Client 模型对象

#### 具有 Prisma 客户端扩展的静态方法 ​

以下示例演示如何创建 Prisma 客户端扩展，以向用户模型添加 signUp 和 findManyByDomain 方法。

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id       String    @id @default(cuid())
  email    String
  password Password?
}

model Password {
  hash   String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId String @unique
}
```

```ts
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient().$extends({
  model: {
    user: {
      async signUp(email: string, password: string) {
        const hash = await bcrypt.hash(password, 10);
        return prisma.user.create({
          data: {
            email,
            password: {
              create: {
                hash,
              },
            },
          },
        });
      },

      async findManyByDomain(domain: string) {
        return prisma.user.findMany({
          where: { email: { endsWith: `@${domain}` } },
        });
      },
    },
  },
});

async function main() {
  // Example usage
  await prisma.user.signUp("user2@example2.com", "s3cret");

  await prisma.user.findManyByDomain("example2.com");
}
```

#### 将模型包装在类中 ​

在下面的示例中，您将看到如何将 Prisma 客户端中的用户模型包装在 Users 类中。

```ts
import { PrismaClient, User } from "@prisma/client";

type Signup = {
  email: string;
  firstName: string;
  lastName: string;
};

class Users {
  constructor(private readonly prismaUser: PrismaClient["user"]) {}

  // Signup a new user
  async signup(data: Signup): Promise<User> {
    // do some custom validation...
    return this.prismaUser.create({ data });
  }
}

async function main() {
  const prisma = new PrismaClient();
  const users = new Users(prisma.user);
  const user = await users.signup({
    email: "alice@prisma.io",
    firstName: "Alice",
    lastName: "Prisma",
  });
}
```

使用这个新的 Users 类，您可以定义注册等自定义功能：
请注意，在上面的示例中，您仅公开了 Prisma 客户端的注册方法。 Prisma 客户端隐藏在 Users 类中，因此您无法再调用 findMany 和 upsert 等方法。
当您拥有大型应用程序并且您想要有意限制模型的功能时，此方法非常有效。

#### 扩展 Prisma Client 模型对象

但是，如果您不想隐藏现有功能但仍想将自定义功能分组在一起怎么办？
在这种情况下，您可以使用 Object.assign 来扩展 Prisma Client，而不限制其功能：

```ts
import { PrismaClient, User } from "@prisma/client";

type Signup = {
  email: string;
  firstName: string;
  lastName: string;
};

function Users(prismaUser: PrismaClient["user"]) {
  return Object.assign(prismaUser, {
    /**
     * Signup the first user and create a new team of one. Return the User with
     * a full name and without a password
     */
    async signup(data: Signup): Promise<User> {
      return prismaUser.create({ data });
    },
  });
}

async function main() {
  const prisma = new PrismaClient();
  const users = Users(prisma.user);
  const user = await users.signup({
    email: "alice@prisma.io",
    firstName: "Alice",
    lastName: "Prisma",
  });
  const numUsers = await users.count();
  console.log(user, numUsers);
}
```

现在，您可以将自定义注册方法与 count、updateMany、groupBy() 以及 Prisma Client 提供的所有其他精彩方法一起使用。最重要的是，它都是类型安全的！

#### [Going further](https://www.prisma.io/docs/orm/prisma-client/queries/custom-models#going-further)

### Case sensitivity

区分大小写会影响数据的过滤和排序，并由数据库排序规则决定。根据您的设置，排序和过滤数据会产生不同的结果。

如果您使用关系数据库连接器，Prisma Client 会尊重您的数据库排序规则。使用 Prisma Client 支持不区分大小写的过滤和排序的选项和建议取决于您的数据库提供商。

如果您使用 MongoDB 连接器，Prisma 客户端将使用 RegEx 规则来启用不区分大小写的过滤。连接器不使用 MongoDB 排序规则 。

#### 数据库排序规则和区分大小写 ​

**INFO：**
_在 Prisma 客户端上下文中，以下部分仅涉及关系数据库连接器。_

排序规则指定数据在数据库中的排序和比较方式，其中包括大小写。排序规则是您在设置数据库时选择的内容。

#### 不区分大小写的过滤选项 ​

使用 Prisma Client 支持不区分大小写过滤的推荐方法取决于您的底层提供商。

##### PostgreSQL provider

PostgreSQL 默认使用确定性排序规则，这意味着过滤区分大小写。要支持不区分大小写的过滤，请在每个字段上使用 mode: 'insensitive' 属性。
使用过滤器的`mode`属性，如下所示：

```ts
const users = await prisma.user.findMany({
  where: {
    email: {
      endsWith: "prisma.io",
      mode: "insensitive", // Default value: default
    },
  },
});
```

另请参阅：[过滤（不区分大小写的过滤）](https://www.prisma.io/docs/orm/prisma-client/queries/filtering-and-sorting#case-insensitive-filtering)

###### 注意事项

- 您不能将不区分大小写的过滤与 C 排序规则一起使用
- [citext](https://www.postgresql.org/docs/12/citext.html)行总是不区分大小写的，并且不受 `mode` 属性影响

###### 性能

如果您严重依赖不区分大小写的过滤，请考虑在 PostgreSQL 数据库中创建索引以提高性能：

- [Create an expression index](https://www.postgresql.org/docs/current/indexes-expressional.html) for Prisma Client queries that use equals or not
- Use the pg_trgm module to [create a trigram-based index](https://www.postgresql.org/docs/12/pgtrgm.html#id-1.11.7.40.7) for Prisma Client queries that use startsWith, endsWith, contains (maps toLIKE / ILIKE in PostgreSQL)

##### MySQL provider

MySQL 默认使用不区分大小写的排序规则。因此，使用 Prisma Client 和 MySQL 进行过滤默认不区分大小写。
`mode: 'insensitive'`属性不是必需的，因此在生成的 Prisma 客户端 API 中不可用。

###### 注意事项

您必须使用不区分大小写 (\_ci) 排序规则才能支持不区分大小写的过滤。 Prisma 客户端不支持 MySQL 提供程序的模式过滤器属性。

##### MongoDB provider

要支持不区分大小写的过滤，请在每个字段的基础上使用 `mode: 'insensitive'` 属性：

```ts
const users = await prisma.user.findMany({
  where: {
    email: {
      endsWith: "prisma.io",
      mode: "insensitive", // Default value: default
    },
  },
});
```

MongoDB 使用 RegEx 规则进行不区分大小写的过滤。

##### SQLite provider

默认情况下，Prisma 客户端在 SQLite 数据库中创建的文本字段不支持不区分大小写的过滤。在 SQLite 中，只能对 ASCII 字符进行不区分大小写的比较。
要为每列的不区分大小写的过滤启用有限支持（仅限 ASCII），您需要在定义文本列时添加 COLLATE NOCASE。

###### 向新列添加不区分大小写的过滤。​

要将不区分大小写的过滤添加到新列，您将需要修改 Prisma Client 创建的迁移文件。

1. 采用以下 Prisma Schema 模型：

```prisma
model User {
  id    Int    @id
  email String
}
```

2. 并使用 `prisma migrate dev --create-only` 创建以下迁移文件：

```sql
-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL
);
```

3. 您需要将 COLLATE NOCASE 添加到电子邮件列，以便可以进行不区分大小写的过滤：

```sql
-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    //highlight-next-line
    "email" TEXT NOT NULL COLLATE NOCASE
);
```

###### 向现有列添加不区分大小写的过滤。​

由于在 SQLite 中无法更新列，因此只能通过创建空白迁移文件并将数据迁移到新表来将 COLLATE NOCASE 添加到现有列。

1. 采用以下 Prisma Schema 模型：

```prisma
model User {
  id    Int    @id
  email String
}
```

2. 并使用 `prisma migrate dev --create-only` 创建一个空的迁移文件，您将需要重命名当前的 User 表并使用 COLLATE NOCASE 创建一个新的 User 表。

```sql
-- UpdateTable
ALTER TABLE "User" RENAME TO "User_old";

CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL COLLATE NOCASE
);

INSERT INTO "User" (id, email)
SELECT id, email FROM "User_old";

DROP TABLE "User_old";
```

##### Microsoft SQL Server provider

Microsoft SQL Server 默认使用不区分大小写的排序规则。因此，使用 Prisma Client 和 Microsoft SQL Server 进行过滤默认情况下不区分大小写。
`mode: 'insensitive'`属性不是必需的，因此在生成的 Prisma 客户端 API 中不可用。

### Query optimization

#### 调试性能问题 ​

几种常见的做法可能会导致查询缓慢和性能问题，例如：

- 过度获取数据
- 缺失索引
- 不缓存重复的查询
- 执行全表扫描

**INFO：**
_有关性能问题的更多潜在原因，请访问[此页面](https://www.prisma.io/docs/optimize/recommendations)。_

[Prisma Optimize](https://www.prisma.io/docs/optimize)提供[建议](https://www.prisma.io/docs/optimize/recommendations)来识别和解决上面列出的低效问题以及其他问题，从而帮助提高查询性能。

首先，请按照[集成指南](https://www.prisma.io/docs/optimize/getting-started)并将 Prisma Optimize 添加到您的项目中以开始诊断慢速查询。

**TIP：**
_您还可以在[客户端级别记录查询事件](https://www.prisma.io/docs/orm/prisma-client/observability-and-logging/logging#event-based-logging)，以查看生成的查询、其参数和执行时间。_
_如果您特别关注监控查询持续时间，请考虑使用[日志记录中间件](https://www.prisma.io/docs/orm/prisma-client/client-extensions/middleware/logging-middleware)。_

#### 使用批量查询

批量读取和写入大量数据通常性能更高。
PrismaClient 支持以下批量查询：

- createMany()
- createManyAndReturn()
- deleteMany()
- updateMany()
- findMany()

#### 重用 PrismaClient 或使用连接池以避免数据库连接池耗尽

创建 PrismaClient 的多个实例可能会耗尽数据库连接池，尤其是在无服务器或边缘环境中，可能会减慢其他查询的速度。在无服务器挑战中[了解更多信息](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections#the-serverless-challenge)。

对于具有传统服务器的应用程序，实例化 PrismaClient 一次并在整个应用程序中重复使用它，而不是创建多个实例。

对于具有使用 HMR（热模块替换）框架的无服务器开发环境，请确保在[开发中正确处理 Prisma 的单个实例](https://www.prisma.io/docs/orm/more/help-and-troubleshooting/help-articles/nextjs-prisma-client-dev-practices)。

#### 解决 n+1 问题 ​

当您循环查询的结果并对每个结果执行一个额外的查询时，就会出现 n+1 问题，从而导致 n 个查询加上原始的 (n+1) 个查询。
这是 ORM 的一个常见问题，特别是与 GraphQL 结合使用时，因为代码生成低效查询并不总是立即显而易见。

##### [使用 `findUnique()` 和 Prisma 客户端的数据加载器在 GraphQL 中求解 n+1​](https://www.prisma.io/docs/orm/prisma-client/queries/query-optimization-performance#solving-n1-in-graphql-with-findunique-and-prisma-clients-dataloader)

## write your own SQL

### TypedSQL

要开始在 Prisma 项目中使用 TypedSQL，请按照以下步骤操作：

1. 确保您已安装 @prisma/client 和 prisma 并更新至至少版本 5.19.0。

```CLI
npm install @prisma/client@latest
npm install -D prisma@latest
```

2. 将 typedSql 预览功能标志添加到您的 schema.prisma 文件中：

```prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["typedSql"]
}
```

3. 在 prisma 目录中创建一个 sql 目录。您将在此处编写 SQL 查询。

```CLI
mkdir -p prisma/sql
```

4. 在 prisma/sql 目录中创建一个新的 .sql 文件。
   例如，getUsersWithPosts.sql。请注意，文件名必须是有效的 JS 标识符，并且不能以 $ 开头。

5. 在新的 .sql 文件中写入 SQL 查询。
   例如：prisma/sql/getUsersWithPosts.sql

```sql
SELECT u.id, u.name, COUNT(p.id) as "postCount"
FROM "User" u
LEFT JOIN "Post" p ON u.id = p."authorId"
GROUP BY u.id, u.name
```

6. 使用 sql 标志生成 Prisma 客户端，以确保为 SQL 查询创建 TypeScript 函数和类型：

**WARNING:**
_确保在使用 sql 标志生成客户端之前应用所有挂起的迁移。_

```CLI
prisma generate --sql
```

如果您不想在每次更改后重新生成客户端，此命令也适用于现有的 `--watch` 标志：

```CLI
prisma generate --sql --watch
```

7. 现在您可以在 TypeScript 代码中导入和使用 SQL 查询：

```ts
import { PrismaClient } from "@prisma/client";
import { getUsersWithPosts } from "@prisma/client/sql";

const prisma = new PrismaClient();

const usersWithPostCounts = await prisma.$queryRawTyped(getUsersWithPosts());
console.log(usersWithPostCounts);
```

#### 将参数传递给 TypedSQL 查询 ​

要将参数传递给 TypedSQL 查询，您可以使用参数化查询。这允许您编写灵活且可重用的 SQL 语句，同时保持类型安全。操作方法如下：

1. 在 SQL 文件中，对要传递的参数使用占位符。占位符的语法取决于您的数据库引擎：

- 对于 PostgreSQL，使用位置占位符 $1、$2 等：

```sql
SELECT id, name, age
FROM users
WHERE age > $1 AND age < $2
```

- 对于 MySQL，使用位置占位符 ?：

```sql
SELECT id, name, age
FROM users
WHERE age > ? AND age < ?
```

- 在 SQLite 中，您可以使用许多不同的占位符。位置占位符（$1、$2 等）、一般占位符（?）和命名占位符（:minAge、:maxAge 等）均可用。对于此示例，我们将使用命名占位符 :minAge 和 :maxAge：

```sql
SELECT id, name, age
FROM users
WHERE age > :minAge AND age < :maxAge
```

2. 在 TypeScript 代码中使用生成的函数时，请将参数作为附加参数传递给 $queryRawTyped：

```ts
import { PrismaClient } from "@prisma/client";
import { getUsersByAge } from "@prisma/client/sql";

const prisma = new PrismaClient();

const minAge = 18;
const maxAge = 30;
const users = await prisma.$queryRawTyped(getUsersByAge(minAge, maxAge));
console.log(users);
```

通过使用参数化查询，您可以确保类型安全并防止 SQL 注入漏洞。 TypedSQL 生成器将根据您的 SQL 查询为参数创建适当的 TypeScript 类型，为查询结果和输入参数提供完整的类型检查。

#### 将参数传递给 TypedSQL 查询 ​

TypedSQL 支持将数组作为 PostgreSQL 的参数传递。将 PostgreSQL 的 ANY 运算符与数组参数结合使用。

```sql
SELECT id, name, email
FROM users
WHERE id = ANY($1)
```

```ts
import { PrismaClient } from "@prisma/client";
import { getUsersByIds } from "@prisma/client/sql";

const prisma = new PrismaClient();

const userIds = [1, 2, 3];
const users = await prisma.$queryRawTyped(getUsersByIds(userIds));
console.log(users);
```

TypedSQL 将为数组参数生成适当的 TypeScript 类型，确保输入和查询结果的类型安全。

**NOTE:**
_传递数组参数时，请注意数据库在单个查询中支持的占位符的最大数量。对于非常大的数组，您可能需要将查询拆分为多个较小的查询。_

#### 在 SQL 文件中定义参数类型 ​

TypedSQL 中的参数键入是通过 SQL 文件中的特定注释来完成的。这些评论的形式如下：

```sql
-- @param {Type} $N:alias optional description
```

其中 Type 是有效的数据库类型，N 是参数在查询中的位置，alias 是 TypeScript 类型中使用的参数的可选别名。
当前接受的类型包括 Int、BigInt、Float、Boolean、String、DateTime、Json、Bytes 和 Decimal。
例如，如果您需要输入带有别名和描述“用户名”的单个字符串参数，则可以将以下注释添加到 SQL 文件中：

```sql
-- @param {String} $1:name The name of the user
```

无论数据库引擎如何，参数类型定义的格式都是相同的。

**NOTE:**
_数组参数不支持手动参数类型定义。对于这些参数，您需要依赖 TypedSQL 提供的类型推断。_

#### [示例](https://github.com/prisma/prisma-examples)

#### TypedSQL 的局限性 ​

##### 支持的数据库 ​

TypedSQL 支持现代版本的 MySQL 和 PostgreSQL，无需任何进一步配置。对于 8.0 之前的 MySQL 版本和所有 SQLite 版本，您需要在 SQL 文件中手动描述参数类型。输入类型在 PostgreSQL 和 MySQL 8.0 及更高版本的所有受支持版本中推断。

TypedSQL 不适用于 MongoDB，因为它是专门为 SQL 数据库设计的。

##### 需要活动数据库连接

TypedSQL 需要活动的数据库连接才能正常运行。这意味着您需要有一个正在运行的数据库实例，Prisma 在使用 --sql 标志生成客户端时可以连接到该实例。如果您的 Prisma 配置中提供了 directUrl，TypedSQL 将使用它进行连接。

##### 带有动态列的动态 SQL 查询 ​

TypedSQL 本身不支持使用动态添加的列构造 SQL 查询。当您需要创建在运行时确定列的查询时，必须使用 $queryRaw 和 $executeRaw 方法。这些方法允许执行原始 SQL，其中可以包括动态列选择。

使用动态列选择的查询示例：

```ts
const columns = "name, email, age"; // Columns determined at runtime
const result = await prisma.$queryRawUnsafe(
  `SELECT ${columns} FROM Users WHERE active = true`
);
```

在此示例中，要选择的列是动态定义的并包含在 SQL 查询中。虽然这种方法提供了灵活性，但它需要仔细注意安全性，特别是避免 SQL 注入漏洞。此外，使用原始 SQL 查询意味着放弃 TypedSQL 的类型安全和 DX。

### Raw queries

Prisma 客户端支持将原始查询发送到数据库的选项。
如果出现以下情况，您可能希望使用原始查询：

- 您想要运行高度优化的查询
- 您需要 Prisma 客户端 尚未支持的特性

原始查询适用于 Prisma ORM 支持的所有关系数据库。此外，从版本 3.9.0 开始，MongoDB 支持原始查询。有关更多详细信息，请参阅相关部分：

- [使用关系数据库的原始查询](https://www.prisma.io/docs/orm/prisma-client/using-raw-sql/raw-queries#raw-queries-with-relational-databases)
- [使用 MongoDB 进行原始查询](https://www.prisma.io/docs/orm/prisma-client/using-raw-sql/raw-queries#raw-queries-with-mongodb)

#### 在关系数据库中使用原始查询 ​

对于关系数据库，Prisma Client 公开了四种允许您发送原始查询的方法。您可以使用：

- `$queryRaw` 返回实际记录（例如，使用 `SELECT`）。
- `$executeRaw` 返回受影响行的计数（例如，在 `UPDATE` 或 `DELETE` 之后）。
- `$queryRawUnsafe` 使用原始字符串返回实际记录（例如，使用 `SELECT`）。
- `$executeRawUnsafe` 使用原始字符串返回受影响行的计数（例如，在 `UPDATE` 或 `DELETE` 之后）。

名称中带有“Unsafe”的方法更加灵活，但存在使代码容易受到 SQL 注入攻击的巨大风险。

其他两种方法可以安全地使用简单的模板标记，无需构建字符串，也无需连接。但是，对于更复杂的用例需要谨慎，因为如果以某些方式使用这些方法，仍然可能引入 SQL 注入。有关更多详细信息，[请参阅下面的 SQL 注入预防部分](#sql-注入预防)。

**NOTE:**
_以上列表中的所有方法一次只能运行一个查询。您不能附加第二个查询 - 例如，使用 `select 1;select 2;` 将调用 `select 1` 查询， `select 2` 不会起作用。_

##### `$queryRaw`

`$queryRaw` 返回实际的数据库记录。
例如，以下 SELECT 查询返回 User 表中每条记录的所有字段：

```ts
const result = await prisma.$queryRaw`SELECT * FROM User`;
```

该方法作为[tagged template](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates)实现，它允许您传递模板文字，您可以在其中轻松插入变量。反过来，Prisma 客户端会创建免受 SQL 注入攻击的准备好的语句：

```ts
const email = "emelie@prisma.io";
const result =
  await prisma.$queryRaw`SELECT * FROM User WHERE email = ${email}`;
```

您还可以使用 Prisma.sql 帮助器，事实上， $queryRaw 方法只接受模板字符串或 Prisma.sql 帮助器：

```ts
const email = "emelie@prisma.io";
const result = await prisma.$queryRaw(
  Prisma.sql`SELECT * FROM User WHERE email = ${email}`
);
```

**WARNING:**
_如果您使用字符串构建将不受信任的输入合并到传递给此方法的查询中，那么您就有可能遭受 SQL 注入攻击。 SQL 注入攻击可能会使您的数据遭到修改或删除。首选机制是在运行此方法时包含查询文本。有关此风险的更多信息以及如何预防该风险的示例，请参阅下面的 SQL 注入预防部分。_

**注意事项 ​:**

- 模板变量不能在 SQL 字符串文字内使用。例如，以下查询将不起作用：

```ts
const name = "Bob";
await prisma.$queryRaw`SELECT 'My name is ${name}';`;
```

- 相反，您可以将整个字符串作为变量传递，或使用字符串连接：

```ts
const name = "My name is Bob";
await prisma.$queryRaw`SELECT ${name};`;
```

- 模板变量**只能用于数据值**（例如上例中的电子邮件）。**变量不能用于标识符**，例如列名、表名或数据库名，也不能用于 SQL 关键字。例如，以下两个查询将不起作用：

```ts
const myTable = "user";
await prisma.$queryRaw`SELECT * FROM ${myTable};`;

const ordering = "desc";
await prisma.$queryRaw`SELECT * FROM Table ORDER BY ${ordering};`;
```

- Prisma 将 `$queryRaw` 和 `$queryRawUnsafe` 返回的任何数据库值映射到其相应的 JavaScript 类型。[了解更多](https://www.prisma.io/docs/orm/prisma-client/using-raw-sql/raw-queries#raw-query-type-mapping)

- `$queryRaw` 不支持 PostgreSQL 数据库中的动态表名称。[了解更多](https://www.prisma.io/docs/orm/prisma-client/using-raw-sql/raw-queries#dynamic-table-names-in-postgresql)

###### 返回类型 ​

`$queryRaw` 返回一个数组。每个对象对应一条数据库记录：

```ts
[
  { id: 1, email: "emelie@prisma.io", name: "Emelie" },
  { id: 2, email: "yin@prisma.io", name: "Yin" },
];
```

###### 签名

```ts
$queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): PrismaPromise<T>;
```

###### 输入 $queryRaw 结果 ​

PrismaPromise<T> 使用泛型类型参数 T。您可以在调用 $queryRaw 方法时确定 T 的类型。在以下示例中，$queryRaw 返回 User[]：

```ts
// import the generated `User` type from the `@prisma/client` module
import { User } from "@prisma/client";

const result = await prisma.$queryRaw<User[]>`SELECT * FROM User`;
// result is of type: `User[]`
```

**NOTE:**
_注意：如果您不提供类型，$queryRaw 默认为未知。_

如果您选择模型的特定字段或想要包含关系，[请参阅有关利用 Prisma Client 生成类型的文档](https://www.prisma.io/docs/orm/prisma-client/type-safety/operating-against-partial-structures-of-model-types#problem-using-variations-of-the-generated-model-type)（如果您想确保结果输入正确）。

###### 使用原始 SQL 时的输入注意事项 ​

当您键入 `$queryRaw` 的结果时，原始数据可能并不总是与建议的 TypeScript 类型匹配。例如，以下 Prisma 模型包含一个名为 published 的布尔字段：

```ts
model Post {
  id        Int     @id @default(autoincrement())
  published Boolean @default(false)
  title     String
  content   String?
}
```

以下查询返回所有帖子。然后它打印出每个帖子的已发布字段的值：

```ts
const result = await prisma.$queryRaw<Post[]>`SELECT * FROM Post`;

result.forEach((x) => {
  console.log(x.published);
});
```

对于常规 CRUD 查询，Prisma 客户端查询引擎标准化了所有数据库的返回类型。使用原始查询则不会。如果数据库提供程序是 MySQL，则返回值为 1 或 0。但是，如果数据库提供程序是 PostgreSQL，则返回值为 true 或 false。

###### PostgreSQL 中的动态表名称 ​

无法插入表名称。这意味着您不能将动态表名称与 `$queryRaw` 一起使用。相反，您必须使用 `$queryRawUnsafe`，如下所示：
请注意，如果将 $queryRawUnsafe 与用户输入结合使用，则会面临 SQL 注入攻击的风险。[了解更多](#sql-注入预防)

##### `$queryRawUnsafe()`

**WARNING:**
_如果您将此方法与用户输入一起使用（换句话说，SELECT _ FROM table WHERE columnx = ${userInput}），那么您就有可能遭受 SQL 注入攻击。 SQL 注入攻击可能会使您的数据遭到修改或删除。*
*只要有可能，您应该使用 $queryRaw 方法。如果正确使用 $queryRaw 方法会明显更安全，但请注意，$queryRaw 方法在某些情况下也可能容易受到攻击。有关详细信息，[请参阅下面的 SQL 注入预防部分。](#sql-注入预防)\*
以下查询返回 User 表中每条记录的所有字段：

```ts
// import the generated `User` type from the `@prisma/client` module
import { User } from "@prisma/client";

const result = await prisma.$queryRawUnsafe("SELECT * FROM User");\
```

您还可以运行参数化查询。以下示例返回电子邮件包含字符串 emelie@prisma.io 的所有用户：

```ts
prisma.$queryRawUnsafe(
  "SELECT * FROM users WHERE email = $1",
  "emelie@prisma.io"
);
```

[有关使用参数化查询的更多详细信息](https://www.prisma.io/docs/orm/prisma-client/using-raw-sql/raw-queries#parameterized-queries)

###### 签名 ​

```ts
$queryRawUnsafe<T = unknown>(query: string, ...values: any[]): PrismaPromise<T>;
```

##### `$executeRaw`

`$executeRaw` 返回受数据库操作（例如 UPDATE 或 DELETE）影响的行数。该函数不返回数据库记录。以下查询更新数据库中的记录并返回已更新的记录数：

```ts
const result: number =
  await prisma.$executeRaw`UPDATE User SET active = true WHERE emailValidated = true`;
```

该方法作为 [tagged template](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates) 实现，它允许您传递模板文字，您可以在其中轻松插入变量。反过来，Prisma 客户端会创建免受 SQL 注入攻击的准备好的语句：

```ts
const emailValidated = true;
const active = true;

const result: number =
  await prisma.$executeRaw`UPDATE User SET active = ${active} WHERE emailValidated = ${emailValidated};`;
```

###### 注意事项 ​

- `$executeRaw` 不支持单个字符串中的多个查询（例如，同时执行 `ALTER TABLE` 和 `CREATE TABLE`）。
- Prisma Client 提交准备好的语句，准备好的语句仅允许 SQL 语句的子集。
  例如，不允许 START TRANSACTION。[您可以在此处了解有关 MySQL 在准备语句中允许的语法的更多信息](https://dev.mysql.com/doc/refman/8.0/en/sql-prepared-statements.html)。
- [PREPARE 不支持 ALTER](https://www.postgresql.org/docs/current/sql-prepare.html) - [请参阅解决方法](https://www.prisma.io/docs/orm/prisma-client/using-raw-sql/raw-queries#alter-limitation-postgresql)。
- 模板变量不能在 SQL 字符串文字内使用。例如，以下查询将不起作用：

```ts
const name = "Bob";
await prisma.$executeRaw`UPDATE user SET greeting = 'My name is ${name}';`;
```

相反，您可以将整个字符串作为变量传递，或使用字符串连接：

```ts
const name = "My name is Bob";
await prisma.$executeRaw`UPDATE user SET greeting = ${name};`;
const name = "Bob";
await prisma.$executeRaw`UPDATE user SET greeting = 'My name is ' || ${name};`;
```

- 模板变量只能用于数据值（例如上例中的电子邮件）。变量不能用于标识符，例如列名、表名或数据库名，也不能用于 SQL 关键字。例如，以下两个查询将不起作用：

```ts
const myTable = "user";
await prisma.$executeRaw`UPDATE ${myTable} SET active = true;`;

const ordering = "desc";
await prisma.$executeRaw`UPDATE User SET active = true ORDER BY ${desc};`;
```

###### 返回类型 ​

`$executeRaw` 返回一个数字。

###### 签名 ​

```ts
$executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): PrismaPromise<number>;
```

##### `$executeRawUnsafe()​`

`$executeRawUnsafe()` 方法允许您将原始字符串（或模板字符串）传递到数据库。与 `$executeRaw` 一样，它不返回数据库记录，而是返回受影响的行数。
以下示例使用模板字符串来更新数据库中的记录。然后它返回已更新的记录数：

```ts
const emailValidated = true;
const active = true;

const result = await prisma.$executeRawUnsafe(
  `UPDATE User SET active = ${active} WHERE emailValidated = ${emailValidated}`
);
```

同样可以写成参数化查询：

```ts
const result = prisma.$executeRawUnsafe(
  "UPDATE User SET active = $1 WHERE emailValidated = $2",
  "yin@prisma.io",
  true
);
```

###### 签名 ​

```ts
$executeRawUnsafe<T = unknown>(query: string, ...values: any[]): PrismaPromise<number>;
```

###### 原始查询类型映射 ​

Prisma 将 `$queryRaw` 和 `$queryRawUnsafe` 返回的任何数据库值映射到其相应的 JavaScript 类型。此行为与常规 Prisma 查询方法（如 `findMany()`）相同。
下表显示了数据库中使用的类型与原始查询返回的 JavaScript 类型之间的转换：
| Database type | JavaScript type |
| ----------------------- | ------------------------------ |
| Text | String |
| 32-bit integer | Number |
| Floating point number | Number |
| Double precision number | Number |
| 64-bit integer | BigInt |
| Decimal / numeric | Decimal |
| Bytes | Uint8Array (before v6: Buffer) |
| Json | Object |
| DateTime | Date |
| Date | Date |
| Time | Date |
| Uuid | String |
| Xml | String |
请注意，每种数据库类型的确切名称因数据库而异，例如，布尔类型在 PostgreSQL 中称为 boolean，在 CockroachDB 中称为 STRING。有关每个数据库的类型名称的完整详细信息，[请参阅标量类型参考](https://www.prisma.io/docs/orm/reference/prisma-schema-reference#model-field-scalar-types)。

##### 原始查询类型转换行为 ​

使用 Prisma Client 的原始查询可能要求参数采用 SQL 函数或查询的预期类型。 Prisma Client 不进行微妙的隐式转换。
例如，使用 PostgreSQL 的 LENGTH 函数进行以下查询，该函数仅接受文本类型作为输入：

```ts
await prisma.$queryRaw`SELECT LENGTH(${42});`;
```

该查询返回一个错误：

```
// ERROR: function length(integer) does not exist
// HINT: No function matches the given name and argument types. You might need to add explicit type casts.
```

这种情况下的解决方案是将 42 显式转换为文本类型：

```ts
await prisma.$queryRaw`SELECT LENGTH(${42}::text);`;
```

##### 交易 ​

在 2.10.0 及更高版本中，您可以在事务内使用 `.$executeRaw()` 和 `.$queryRaw()`。

##### 使用变量 ​

`$executeRaw` 和 `$queryRaw` 被实现为 标记模板。标记模板是在 Prisma 客户端中使用原始 SQL 变量的推荐方法。
以下示例包含名为 ${userId} 的占位符：

```ts
const userId = 42;
const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${userId};`;
```

使用 `$queryRaw` 和 `$executeRaw` 的标记模板版本的好处包括：

- Prisma 客户端转义所有变量。
- 标记模板与数据库无关 - 您不需要记住变量是否应该写为 $1 (PostgreSQL) 还是 ? （MySQL）。
- [Tagged template helpers](https://www.prisma.io/docs/orm/prisma-client/using-raw-sql/raw-queries#tagged-template-helpers)
- 嵌入式命名变量更易于阅读。
  **NOTE:**
  _您不能将表名或列名传递到模板字符串的占位符中。例如，您不能`select ?`并根据某些条件传入 `_`或`id、name`。\*

###### Tagged template helpers

Prisma 客户端专门使用 SQL 模板标签 ，它公开了许多帮助程序。例如，以下查询使用 join() 传入 ID 列表：

```ts
import { Prisma } from "@prisma/client";

const ids = [1, 3, 5, 10, 20];
const result =
  await prisma.$queryRaw`SELECT * FROM User WHERE id IN (${Prisma.join(ids)})`;
```

以下示例使用`empty`和 `sql`helpers 根据 userName 是否为空来更改查询：

```ts
import { Prisma } from "@prisma/client";

const userName = "";
const result = await prisma.$queryRaw`SELECT * FROM User ${
  userName ? Prisma.sql`WHERE name = ${userName}` : Prisma.empty // Cannot use "" or NULL here!
}`;
```

###### ALTER 限制 (PostgreSQL)​

PostgreSQL 不支持在准备好的语句中使用 ALTER，这意味着以下查询将不起作用：

```ts
await prisma.$executeRaw`ALTER USER prisma WITH PASSWORD "${password}"`;
await prisma.$executeRaw(
  Prisma.sql`ALTER USER prisma WITH PASSWORD "${password}"`
);
```

您可以使用以下查询，但请注意，这可能不安全，因为 `${password}` 未转义：

```ts
await prisma.$executeRawUnsafe('ALTER USER prisma WITH PASSWORD "$1"', password})
```

##### 不支持的类型 ​

不支持的类型需要先转换为 Prisma 客户端支持的类型，然后才能在 $queryRaw 或 $queryRawUnsafe 中使用它们。例如，采用以下模型，其中有一个类型为“不支持”的位置字段：

```prisma
model Country {
  location  Unsupported("point")?
}
```

对于不受支持的字段，以下查询将不起作用：

```ts
await prisma.$queryRaw`SELECT location FROM Country;`;
```

相反，如果您的“不支持”列支持转换，请将“不支持”字段转换为任何支持的 Prisma 客户端类型。
您可能希望将 Unsupported 列转换为的最常见类型是 String。例如，在 PostgreSQL 上，这将映射到文本类型：

```ts
await prisma.$queryRaw`SELECT location::text FROM Country;`;
```

因此，数据库将提供 Prisma 客户端支持的数据的字符串表示形式。
有关支持的 Prisma 类型的详细信息，[请参阅相关数据库的 Prisma 连接器概述](https://www.prisma.io/docs/orm/overview/databases)。

#### SQL 注入预防

在 Prisma Client 中避免 SQL 注入的理想方法是尽可能使用 ORM 模型执行查询。

##### 在 `$queryRaw` 和 `$executeRaw` ​ 中

###### 简单、安全地使用 `$queryRaw` 和 `$executeRaw​`

当您使用标记模板并将所有查询作为准备好的语句发送时，这些方法可以通过转义所有变量来降低 SQL 注入的风险。

```ts
$queryRaw`...`; // Tagged template
$executeRaw`...`; // Tagged template
```

###### 不安全地使用 `$queryRaw` 和 `$executeRaw​`

然而，也有可能以不安全的方式使用这些方法。
一种方法是人为生成标记模板，该模板不安全地连接用户输入。
以下示例容易受到 SQL 注入攻击：

```ts
// Unsafely generate query text
const inputString = `'Sarah' UNION SELECT id, title FROM "Post"`; // SQL Injection
const query = `SELECT id, name FROM "User" WHERE name = ${inputString}`;

// Version for Typescript
const stringsArray: any = [...[query]];

// Version for Javascript
const stringsArray = [...[query]];

// Use the `raw` property to impersonate a tagged template
stringsArray.raw = [query];

// Use queryRaw
const result = await prisma.$queryRaw(stringsArray);
console.log(result);
```

容易受到攻击的另一种方法是滥用 Prisma.raw 函数。
以下示例都容易受到 SQL 注入攻击：

```ts
const inputString = `'Sarah' UNION SELECT id, title FROM "Post"`;
const result =
  await prisma.$queryRaw`SELECT id, name FROM "User" WHERE name = ${Prisma.raw(
    inputString
  )}`;
console.log(result);

const inputString = `'Sarah' UNION SELECT id, title FROM "Post"`;
const result = await prisma.$queryRaw(
  Prisma.raw(`SELECT id, name FROM "User" WHERE name = ${inputString}`)
);
console.log(result);

const inputString = `'Sarah' UNION SELECT id, title FROM "Post"`;
const query = Prisma.raw(
  `SELECT id, name FROM "User" WHERE name = ${inputString}`
);
const result = await prisma.$queryRaw(query);
console.log(result);
```

###### 在更复杂的场景中安全地使用 `$queryRaw` 和 `$executeRaw​`

- **构建与查询执行分开的原始查询 ​**
  如果您想在其他地方构建原始查询或与参数分开，则需要使用以下方法之一。
  在此示例中，sql 帮助程序方法用于通过安全地包含变量来构建查询文本。它对于 SQL 注入是安全的：

```ts
// inputString can be untrusted input
const inputString = `'Sarah' UNION SELECT id, title FROM "Post"`;

// Safe if the text query below is completely trusted content
const query = Prisma.sql`SELECT id, name FROM "User" WHERE name = ${inputString}`;

const result = await prisma.$queryRaw(query);
console.log(result);
```

在此示例中，可以安全地避免 SQL 注入，sql 辅助方法用于构建查询文本，其中包括输入值的参数标记。每个变量都由一个标记符号表示（对于 MySQL 为 ?，对于 PostgreSQL 为 $1、$2 等）。请注意，这些示例仅显示 PostgreSQL 查询。

```ts
// Version for Typescript
const query: any;

// Version for Javascript
const query;

// Safe if the text query below is completely trusted content
query = Prisma.sql`SELECT id, name FROM "User" WHERE name = $1`;

// inputString can be untrusted input
const inputString = `'Sarah' UNION SELECT id, title FROM "Post"`;
query.values = [inputString];

const result = await prisma.$queryRaw(query);
console.log(result);
```

- **在其他地方或分阶段构建原始查询 ​**
  如果您想在执行查询的地方以外的地方构建原始查询，则理想的方法是从查询段创建一个 Sql 对象并向其传递参数值。

在下面的示例中，我们有两个要参数化的变量。只要传递给 Prisma.sql 的查询字符串仅包含可信内容，该示例就可以安全地防止 SQL 注入：

```ts
// Example is safe if the text query below is completely trusted content
const query1 = `SELECT id, name FROM "User" WHERE name = `; // The first parameter would be inserted after this string
const query2 = ` OR name = `; // The second parameter would be inserted after this string

const inputString1 = "Fred";
const inputString2 = `'Sarah' UNION SELECT id, title FROM "Post"`;

const query = Prisma.sql([query1, query2, ""], inputString1, inputString2);
const result = await prisma.$queryRaw(query);
console.log(result);
```

**NOTE:**
_请注意，作为第一个参数传递的字符串数组 Prisma.sql 需要在末尾有一个空字符串，因为 sql 函数期望比参数数量多一个查询段。_

如果您想将原始查询构建为一个大字符串，这仍然是可能的，但需要小心，因为它使用潜在危险的 Prisma.raw 方法。您还需要使用数据库的正确参数标记构建查询，因为 Prisma 无法像通常那样为相关数据库提供标记。

只要传递到 Prisma.raw 的查询字符串仅包含可信内容，以下示例就可以安全地防止 SQL 注入：

```ts
// Version for Typescript
const query: any;

// Version for Javascript
const query;

// Example is safe if the text query below is completely trusted content
const query1 = `SELECT id, name FROM "User" `;
const query2 = `WHERE name = $1 `;

query = Prisma.raw(`${query1}${query2}`);

// inputString can be untrusted input
const inputString = `'Sarah' UNION SELECT id, title FROM "Post"`;
query.values = [inputString];

const result = await prisma.$queryRaw(query);
console.log(result);
```

##### 在 `$queryRawUnsafe` 和 `$executeRawUnsafe` 中 ​

###### 不安全地使用 `$queryRawUnsafe` 和 `$executeRawUnsafe​`

如果您无法使用标记模板，则可以使用 $queryRawUnsafe 或 $executeRawUnsafe。但是，请注意，这些函数会显着增加代码中 SQL 注入漏洞的风险。
以下示例连接 query 和 inputString。 Prisma Client 在本例中无法转义 inputString，这使得它容易受到 SQL 注入的攻击：

```ts
const inputString = '"Sarah" UNION SELECT id, title, content FROM Post'; // SQL Injection
const query = "SELECT id, name, email FROM User WHERE name = " + inputString;
const result = await prisma.$queryRawUnsafe(query);

console.log(result);
```

###### 参数化查询 ​

作为标记模板的替代方案，`$queryRawUnsafe` 支持标准参数化查询，其中每个变量都由一个符号表示（对于 MySQL 使用 `?`，对于 PostgreSQL 使用 `$1、$2` 等, 以此类推）。请注意，这些示例仅显示 PostgreSQL 查询。
以下示例对于 SQL 注入是安全的：

```ts
const userName = "Sarah";
const email = "sarah@prisma.io";
const result = await prisma.$queryRawUnsafe(
  "SELECT * FROM User WHERE (name = $1 OR email = $2)",
  userName,
  email
);
```

与标记模板一样，Prisma Client 会转义以这种方式提供的所有变量。
**NOTE:**
_您不能将表名或列名作为变量传递到参数化查询中。例如，您不能`SELECT ?`并根据某些条件传入 `_`或`id、name`。\*

**参数化 PostgreSQL ILIKE 查询 ​**
当您使用 `ILIKE` 时，`%` 通配符应包含在变量本身中，而不是查询（字符串）中。此示例对于 SQL 注入是安全的。

```ts
const userName = "Sarah";
const emailFragment = "prisma.io";
const result = await prisma.$queryRawUnsafe(
  'SELECT * FROM "User" WHERE (name = $1 OR email ILIKE $2)',
  userName,
  `%${emailFragment}`
);
```

**NOTE:**
_使用 %$2 作为参数是行不通的_

#### 在 MongoDB 中使用原始查询 ​

`$runCommandRaw()`针对数据库运行原始 MongoDB 命令。作为输入，它接受所有 MongoDB 数据库命令，但以下例外：

- `find`（使用 `findRaw()` 代替）
- `aggregate`（使用`aggregateRaw()`代替）

当您使用 `$runCommandRaw()` 运行 MongoDB 数据库命令时，请注意以下事项：

- 调用 `$runCommandRaw()` 时传递的对象必须遵循 MongoDB 数据库命令的语法。
- 您必须使用 MongoDB 数据库命令的适当角色连接到数据库。

在以下示例中，查询插入具有相同 \_id 的两条记录。这绕过了正常的文档验证。

```ts
prisma.$runCommandRaw({
  insert: "Pets",
  bypassDocumentValidation: true,
  documents: [
    {
      _id: 1,
      name: "Felinecitas",
      type: "Cat",
      breed: "Russian Blue",
      age: 12,
    },
    {
      _id: 1,
      name: "Nao Nao",
      type: "Dog",
      breed: "Chow Chow",
      age: 2,
    },
  ],
});
```

**WARNING:**
不要将 `$runCommandRaw()` 用于包含“find”或“aggregate”命令的查询，因为您可能无法获取所有数据。这是因为 MongoDB 返回一个附加到您的 MongoDB 会话的游标
，并且您可能不会每次都点击相同的 MongoDB 会话。对于这些查询，您应该使用专门的 `findRaw()` 和 `aggregateRaw()` 方法。

##### 返回类型 ​

`$runCommandRaw()` 返回一个 JSON 对象，其形状取决于输入。

##### 签名 ​

```ts
$runCommandRaw(command: InputJsonObject): PrismaPromise<JsonObject>;
```

#### findRaw()

`<model>.findRaw()` 返回实际的数据库记录。它将找到零个或多个与 User 集合上的过滤器匹配的文档：

```ts
const result = await prisma.user.findRaw({
  filter: { age: { $gt: 25 } },
  options: { projection: { _id: false } },
});
```

##### 返回类型 ​

`<model>.findRaw()`返回一个 JSON 对象，其形状取决于输入。

##### 签名 ​

```ts
<model>.findRaw(args?: {filter?: InputJsonObject, options?: InputJsonObject}): PrismaPromise<JsonObject>;
```

- `filter`：[查询过滤器](https://www.mongodb.com/zh-cn/docs/manual/reference/operator/query/)。如果没有指定，那么所有文档都会被匹配。
- `options`：额外的选项去跳过 `find` 命令

#### aggregateRaw()

`<model>.aggregateRaw()` 返回聚合的数据库记录。它将对 User 集合执行聚合操作：

```ts
const result = await prisma.user.aggregateRaw({
  pipeline: [
    { $match: { status: "registered" } },
    { $group: { _id: "$country", total: { $sum: 1 } } },
  ],
});
```

##### 返回类型 ​

`<model>.aggregateRaw()`返回一个 JSON 对象，其形状取决于输入。

##### 签名 ​

```ts
<model>.aggregateRaw(args?: {pipeline?: InputJsonObject[], options?: InputJsonObject}): PrismaPromise<JsonObject>;
```

- `pipeline`：一个在聚合阶段经由[aggregation pipeline](https://www.mongodb.com/zh-cn/docs/manual/reference/operator/aggregation-pipeline/)去处理和转换文档流的数组。
- `options`：额外的选项去跳过 `aggregate` 命令

### SafeQL & Prisma Client

#### 什么是 SafeQL？​

SafeQL 允许在原始 SQL 查询中实现高级 linting 和类型安全。设置后，SafeQL 与 Prisma 客户端 $queryRaw 和 $executeRaw 配合使用，在需要原始查询时提供类型安全。
SafeQL 作为 [ESLint](https://eslint.org/) 插件运行，并使用 ESLint 规则进行配置。本指南不包括设置 ESLint，我们假设您已经在项目中运行了它。

#### 先决条件 ​

- 一个安装了 PostGIS 的 PostgreSQL 数据库
- 在您的项目中设置 Prisma ORM
- 在您的项目中设置 ESLint

#### Prisma ORM 中的地理数据支持 ​

在撰写本文时，Prisma ORM 不支持处理地理数据，特别是使用 PostGIS。
具有地理数据列的模型将使用[不受支持的](https://www.prisma.io/docs/orm/reference/prisma-schema-reference#unsupported)数据类型进行存储。生成的 Prisma 客户端中存在类型不受支持的字段，将设置为`any`类型。具有必需的 `Unsupported` 类型的模型不会公开`create`和`update`等写入操作。
Prisma 客户端支持使用 `$queryRaw` 和 `$executeRaw` 对具有必需的不支持字段的模型进行写入操作。在原始查询中处理地理数据时，您可以使用 Prisma 客户端扩展和 SafeQL 来提高类型安全性。

#### 1. 设置 Prisma ORM 以与 PostGIS 一起使用

如果您还没有启用 postgresqlExtensions Preview 功能，并在您的 Prisma 模式中添加 postgis PostgreSQL 扩展：

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [postgis]
}
```

**WARNING:**
_如果您不使用托管数据库提供商，则可能需要安装 postgis 扩展。[请参阅 PostGIS 的文档](http://postgis.net/documentation/getting_started/#installing-postgis)以了解有关如何开始使用 PostGIS 的更多信息。如果您使用 Docker Compose，则可以使用以下代码片段来设置安装了 PostGIS 的 PostgreSQL 数据库：_

```Docker
version: '3.6'
services:
  pgDB:
    image: postgis/postgis:13-3.1-alpine
    restart: always
    ports:
      - '5432:5432'
    volumes:
      - db_data:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_DB: geoexample
volumes:
  db_data:
```

接下来，创建迁移并执行迁移以启用扩展：

```CLI
npx prisma migrate dev --name add-postgis
```

作为参考，迁移文件的输出应如下所示：

```SQL
-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";
```

您可以通过运行 `prisma migrate status` 来仔细检查迁移是否已应用。

#### 2. 创建一个使用地理数据列的新模型 ​

应用迁移后，添加一个新模型，其中包含具有地理数据类型的列。在本指南中，我们将使用名为 PointOfInterest 的模型。

```prisma
model PointOfInterest {
  id       Int                                   @id @default(autoincrement())
  name     String
  location Unsupported("geography(Point, 4326)")
}
```

您会注意到位置字段使用不支持的类型。这意味着我们在使用 PointOfInterest 时失去了 Prisma ORM 的很多好处。我们将使用 SafeQL 来解决此问题。

与之前一样，使用 prisma migrate dev 命令创建并执行迁移，以在数据库中创建 PointOfInterest 表：

```cli
npx prisma migrate dev --name add-poi
```

作为参考，以下是 Prisma Migrate 生成的 SQL 迁移文件的输出：

```sql
-- CreateTable
CREATE TABLE "PointOfInterest" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "location" geography(Point, 4326) NOT NULL,

    CONSTRAINT "PointOfInterest_pkey" PRIMARY KEY ("id")
);
```

#### 3. 集成 SafeQL​

SafeQL 可轻松与 Prisma ORM 集成，以便检查 $queryRaw 和 $executeRaw Prisma 操作。您可以[参考 SafeQL 的集成指南](https://safeql.dev/compatibility/prisma.html)或按照以下步骤操作。

1. 安装 `@ts-safeql/eslint-plugin` npm 包 ​

```cli
npm install -D @ts-safeql/eslint-plugin
```

2. 将 `@ts-safeql/eslint-plugin` 添加到您的 ESLint 插件 ​
   接下来，将 `@ts-safeql/eslint-plugin` 添加到 ESLint 插件列表中。在我们的示例中，我们使用 .eslintrc.js 文件，但这可以应用于配置 ESLint 的任何方式。

```js
// .eslintrc.js
/** @type {import('eslint').Linter.Config} */
module.exports = {
  "plugins": [..., "@ts-safeql/eslint-plugin"],
  ...
}
```

3. 添加`@ts-safeql/check-sql`规则 ​
   现在，设置规则，使 SafeQL 能够将无效的 SQL 查询标记为 ESLint 错误。

```js
// .eslintrc.js
/** @type {import('eslint').Linter.Config} */
module.exports = {
  plugins: [..., '@ts-safeql/eslint-plugin'],
  rules: {
    '@ts-safeql/check-sql': [
      'error',
      {
        connections: [
          {
            // The migrations path:
            migrationsDir: './prisma/migrations',
            targets: [
              // This makes `prisma.$queryRaw` and `prisma.$executeRaw` commands linted
              { tag: 'prisma.+($queryRaw|$executeRaw)', transform: '{type}[]' },
            ],
          },
        ],
      },
    ],
  },
}
```

**NOTE:**
_注意：如果您的 `PrismaClient` 实例的名称与 `prisma` 不同，您需要相应地调整 `tag` 的值。例如，如果名为 `db`，则 `tag` 的值应为 `db.+($queryRaw|$executeRaw)`。_

4. 连接到您的数据库 ​
   最后，为 SafeQL 设置一个 `connectionUrl`，以便它可以内省您的数据库并检索您在架构中使用的表和列名称。然后，SafeQL 使用此信息来检查和突出显示原始 SQL 语句中的问题。

我们的示例依赖于 `dotenv` 包来获取 Prisma ORM 使用的相同连接字符串。我们建议这样做是为了使您的数据库 URL 不受版本控制。

如果你还没有安装`dotenv`，可以按如下方式安装：

```cli
npm install dotenv
```

然后更新您的 ESLint 配置，如下所示：

```js
// .eslintrc.js
require("dotenv").config();

/** @type {import('eslint').Linter.Config} */
module.exports = {
  plugins: ["@ts-safeql/eslint-plugin"],
  // exclude `parserOptions` if you are not using TypeScript
  parserOptions: {
    project: "./tsconfig.json",
  },
  rules: {
    "@ts-safeql/check-sql": [
      "error",
      {
        connections: [
          {
            connectionUrl: process.env.DATABASE_URL,
            // The migrations path:
            migrationsDir: "./prisma/migrations",
            targets: [
              // what you would like SafeQL to lint. This makes `prisma.$queryRaw` and `prisma.$executeRaw`
              // commands linted
              { tag: "prisma.+($queryRaw|$executeRaw)", transform: "{type}[]" },
            ],
          },
        ],
      },
    ],
  },
};
```

SafeQL 现已完全配置，可帮助您使用 Prisma Client 编写更好的原始 SQL。

#### 4. 创建扩展以使原始 SQL 查询类型安全 ​

1. 添加扩展以创建 `PointOfInterest` 记录 ​
   Prisma 架构中的 PointOfInterest 模型使用`Unsupported`的类型。因此，Prisma 客户端中生成的 PointOfInterest 类型不能用于携带纬度和经度值。
   我们将通过定义两个自定义类型来解决这个问题，它们可以更好地在 TypeScript 中表示我们的模型：

```ts
type MyPoint = {
  latitude: number;
  longitude: number;
};

type MyPointOfInterest = {
  name: string;
  location: MyPoint;
};
```

接下来，您可以将`create`查询添加到 Prisma 客户端的 `pointOfInterest` 属性：

```ts
const prisma = new PrismaClient().$extends({
  model: {
    pointOfInterest: {
      async create(data: {
        name: string;
        latitude: number;
        longitude: number;
      }) {
        // Create an object using the custom types from above
        const poi: MyPointOfInterest = {
          name: data.name,
          location: {
            latitude: data.latitude,
            longitude: data.longitude,
          },
        };

        // Insert the object into the database
        const point = `POINT(${poi.location.longitude} ${poi.location.latitude})`;
        await prisma.$queryRaw`
          INSERT INTO "PointOfInterest" (name, location) VALUES (${poi.name}, ST_GeomFromText(${point}, 4326));
        `;

        // Return the object
        return poi;
      },
    },
  },
});
```

请注意，代码片段中突出显示的行中的 SQL 已由 SafeQL 检查！例如，如果将表名称从“PointOfInterest”更改为“PointOfInterest2”，则会出现以下错误：

```
error  Invalid Query: relation "PointOfInterest2" does not exist  @ts-safeql/check-sql
```

这也适用于列名 `name` 和 `location`。

您现在可以在代码中创建新的 PointOfInterest 记录，如下所示：

```ts
const poi = await prisma.pointOfInterest.create({
  name: "Berlin",
  latitude: 52.52,
  longitude: 13.405,
});
```

2. 添加扩展来查询最接近的 `PointOfInterest` 记录 ​
   现在让我们创建一个 Prisma 客户端扩展来查询该模型。我们将进行扩展，找到距离给定经度和纬度最近的兴趣点。

```ts
const prisma = new PrismaClient().$extends({
  model: {
    pointOfInterest: {
      async create(data: {
        name: string;
        latitude: number;
        longitude: number;
      }) {
        // ... same code as before
      },

      async findClosestPoints(latitude: number, longitude: number) {
        // Query for clostest points of interests
        const result = await prisma.$queryRaw<
          {
            id: number | null;
            name: string | null;
            st_x: number | null;
            st_y: number | null;
          }[]
        >`SELECT id, name, ST_X(location::geometry), ST_Y(location::geometry) 
            FROM "PointOfInterest" 
            ORDER BY ST_DistanceSphere(location::geometry, ST_MakePoint(${longitude}, ${latitude})) DESC`;

        // Transform to our custom type
        const pois: MyPointOfInterest[] = result.map((data) => {
          return {
            name: data.name,
            location: {
              latitude: data.st_x || 0,
              longitude: data.st_y || 0,
            },
          };
        });

        // Return data
        return pois;
      },
    },
  },
});
```

现在，您可以正常使用我们的 Prisma 客户端，使用在 PointOfInterest 模型上创建的自定义方法来查找给定经度和纬度的附近兴趣点。

```ts
const closestPointOfInterest = await prisma.pointOfInterest.findClosestPoints(
  53.5488,
  9.9872
);
```

与之前类似，我们再次受益于 SafeQL 为我们的原始查询添加额外的类型安全性。例如，如果我们通过将 location::geometry 更改为仅 location 来删除对位置的几何转换，我们将分别在 ST_X、ST_Y 或 ST_DistanceSphere 函数中出现 linting 错误。

```
error  Invalid Query: function st_distancesphere(geography, geometry) does not exist  @ts-safeql/check-sql
```

## fields & types

- **使用 Decimal**
  小数字段由 [Decimal.js 库](https://mikemcl.github.io/decimal.js/) 表示。以下示例演示了如何导入和使用 Prisma.Decimal：

```ts
import { PrismaClient, Prisma } from "@prisma/client";

const newTypes = await prisma.sample.create({
  data: {
    cost: new Prisma.Decimal(24.454545),
  },
});
```

**INFO:**
_MongoDB 目前不支持使用 Decimal 字段。_

- **使用 BigInt**
  BigInt 字段由 BigInt 类型表示（需要 Node.js 10.4.0+）。以下示例演示了如何使用 BigInt 类型：

```ts
import { PrismaClient, Prisma } from "@prisma/client";

const newTypes = await prisma.sample.create({
  data: {
    revenue: BigInt(534543543534),
  },
});
```

序列化 BigInt​
Prisma 客户端以纯 JavaScript 对象的形式返回记录。如果您尝试对包含 BigInt 字段的对象使用 JSON.stringify，您将看到以下错误：

```
Do not know how to serialize a BigInt
```

要解决此问题，请使用 JSON.stringify 的自定义实现：

```ts
JSON.stringify(
  this,
  (key, value) => (typeof value === "bigint" ? value.toString() : value) // return everything else unchanged
);
```

- **使用 Bytes**
  字节字段由 Uint8Array 类型表示。以下示例演示了如何使用 Uint8Array 类型：

```ts
import { PrismaClient, Prisma } from "@prisma/client";

const newTypes = await prisma.sample.create({
  data: {
    myField: new Uint8Array([1, 2, 3, 4]),
  },
});
```

请注意，在 Prisma v6 之前，字节由 Buffer 类型表示：

```ts
import { PrismaClient, Prisma } from "@prisma/client";

const newTypes = await prisma.sample.create({
  data: {
    myField: Buffer.from([1, 2, 3, 4]),
  },
});
```

- [**使用 Json**](https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-json-fields)

- [**使用 标量 lists/标量 arrays**](https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-scalar-lists-arrays)

- [**使用复合 ID 和复合唯一约束**​](https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-composite-ids-and-constraints)

### 复合类型

复合类型（在 MongoDB 中称为嵌入文档）允许您将记录嵌入到其他记录中。

我们将在下面的示例中使用此架构：

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

model Product {
  id     String  @id @default(auto()) @map("_id") @db.ObjectId
  name   String  @unique
  price  Float
  colors Color[]
  sizes  Size[]
  photos Photo[]
  orders Order[]
}

model Order {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  product         Product  @relation(fields: [productId], references: [id])
  color           Color
  size            Size
  shippingAddress Address
  billingAddress  Address?
  productId       String   @db.ObjectId
}

enum Color {
  Red
  Green
  Blue
}

enum Size {
  Small
  Medium
  Large
  XLarge
}

type Photo {
  height Int    @default(200)
  width  Int    @default(100)
  url    String
}

type Address {
  street String
  city   String
  zip    String
}
```

在此架构中，Product 模型具有 Photo[] 复合类型，Order 模型具有两个复合 Address 类型。 ShippingAddress 是必需的，但 billingAddress 是可选的。

#### 使用复合类型时的注意事项 ​

目前在 Prisma Client 中使用复合类型时存在一些限制：

- `findUnique()` 无法过滤复合类型
- `aggregate`、`groupBy()`、`count` 不支持复合运算

#### 复合类型必填字段的默认值 ​

从版本 4.0.0 开始，如果在满足以下所有条件时对复合类型执行数据库读取，则 Prisma 客户端会将默认值插入到结果中。

- 复合类型上的字段是必需的，
- 该字段有一个默认值，
- 返回的一个或多个文档中不存在该字段。

Note:

- 这与模型字段的行为相同。
- 在读取操作中，Prisma 客户端将默认值插入到结果中，但不会将默认值插入到数据库中。

在我们的示例架构中，假设您向照片添加必填字段。该字段 bitDepth 有一个默认值：

```prisma
...
type Photo {
  ...
  bitDepth Int @default(8)
}

...
```

假设您随后运行 `npx prisma db Push` 来更新数据库并使用 `npx prismagenerate` 重新生成 Prisma 客户端。然后，运行以下应用程序代码：

```ts
console.dir(await prisma.product.findMany({}), { depth: Infinity });
```

bitDepth 字段没有内容，因为您刚刚添加了该字段，所以查询返回默认值 8。

#### 使用 find 和 findMany 查找包含复合类型的记录 ​

可以通过 `where` 操作中的复合类型来过滤记录。

##### 过滤一种复合类型 ​

使用 `is`、`equals`、`isNot` 和 `isSet` 操作来更改单个复合类型：

- `is`：通过匹配复合类型来过滤结果。需要存在一个或多个字段（例如，按送货地址上的街道名称过滤订单）
- `equals`：通过匹配复合类型来过滤结果。要求所有字段都存在。 （例如，按完整送货地址过滤订单）
- `isNot`：按不匹配的复合类型过滤结果
- `isSet` ：过滤可选字段以仅包含已设置的结果（设置为值或显式设置为 null）。将此过滤器设置为 true 将排除根本未设置的未定义结果。

例如，使用 `is` 过滤街道名称为“555 Candy Cane Lane”的订单：

```ts
const orders = await prisma.order.findMany({
  where: {
    shippingAddress: {
      is: {
        street: "555 Candy Cane Lane",
      },
    },
  },
});
```

使用 `equals` 过滤与送货地址中所有字段匹配的订单：

```ts
const orders = await prisma.order.findMany({
  where: {
    shippingAddress: {
      equals: {
        street: "555 Candy Cane Lane",
        city: "Wonderland",
        zip: "52337",
      },
    },
  },
});
```

您还可以对此查询使用简写符号，其中省略等于：

```ts
const orders = await prisma.order.findMany({
  where: {
    shippingAddress: {
      street: "555 Candy Cane Lane",
      city: "Wonderland",
      zip: "52337",
    },
  },
});
```

使用 `isNot` 过滤邮政编码不为“52337”的订单：

```ts
const orders = await prisma.order.findMany({
  where: {
    shippingAddress: {
      isNot: {
        zip: "52337",
      },
    },
  },
});
```

使用 `isSet` 过滤已设置可选 billingAddress（为某个值或为 null）的订单：

```ts
const orders = await prisma.order.findMany({
  where: {
    billingAddress: {
      isSet: true,
    },
  },
});
```

##### 过滤多种复合类型 ​

使用 `equals`、`isEmpty`、`every`、`some` 和 `none` 操作来过滤多个复合类型：

- `equals`：检查列表的完全相等性
- `isEmpty`：检查列表是否为空
- `every`：列表中的每一项都必须符合条件
- `some`：列表中的一项或多项必须符合条件
- `none`：列表中没有任何项目可以匹配条件
- `isSet`：过滤可选字段以仅包含已设置的结果（设置为值或显式设置为 null）。将此过滤器设置为 true 将排除根本未设置的未定义结果。

例如，您可以使用 `equals` 查找具有特定照片列表的产品（所有 url、高度和宽度字段必须匹配）：

```ts
const product = prisma.product.findMany({
  where: {
    photos: {
      equals: [
        {
          url: "1.jpg",
          height: 200,
          width: 100,
        },
        {
          url: "2.jpg",
          height: 200,
          width: 100,
        },
      ],
    },
  },
});
```

您还可以为此查询使用简写符号，其中省略等于并仅指定要过滤的字段：

```ts
const product = prisma.product.findMany({
  where: {
    photos: [
      {
        url: "1.jpg",
        height: 200,
        width: 100,
      },
      {
        url: "2.jpg",
        height: 200,
        width: 100,
      },
    ],
  },
});
```

使用 `isEmpty` 过滤没有照片的产品：

```ts
const product = prisma.product.findMany({
  where: {
    photos: {
      isEmpty: true,
    },
  },
});
```

使用 `some` 来过滤一张或多张照片的 url 为“2.jpg”的产品：

```ts
const product = prisma.product.findFirst({
  where: {
    photos: {
      some: {
        url: "2.jpg",
      },
    },
  },
});
```

使用 `none` 来过滤没有照片的 url 为“2.jpg”的产品：

```ts
const product = prisma.product.findFirst({
  where: {
    photos: {
      none: {
        url: "2.jpg",
      },
    },
  },
});
```

#### 使用 `create` 和 `createMany` 创建复合类型记录 ​ 类型

**INFO:**
_当您使用具有唯一限制的复合类型创建记录时，请注意，MongoDB 不会在记录内强制执行唯一值。[了解更多](https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/composite-types#duplicate-values-in-unique-fields-of-composite-types)。_

可以使用 `set` 操作在 `create` 或 `createMany` 方法中创建复合类型。
例如，您可以在 `create` 中使用 `set` 在 Order 中创建 Address 复合类型：

```ts
const order = await prisma.order.create({
  data: {
    // Normal relation
    product: { connect: { id: "some-object-id" } },
    color: "Red",
    size: "Large",
    // Composite type
    shippingAddress: {
      set: {
        street: "1084 Candycane Lane",
        city: "Silverlake",
        zip: "84323",
      },
    },
  },
});
```

您还可以使用速记符号，省略集合并仅指定要创建的字段：

```ts
const order = await prisma.order.create({
  data: {
    // Normal relation
    product: { connect: { id: "some-object-id" } },
    color: "Red",
    size: "Large",
    // Composite type
    shippingAddress: {
      street: "1084 Candycane Lane",
      city: "Silverlake",
      zip: "84323",
    },
  },
});
```

对于可选类型，例如 billingAddress，您还可以将该值设置为 null：

```ts
const order = await prisma.order.create({
  data: {
    // Normal relation
    product: { connect: { id: "some-object-id" } },
    color: "Red",
    size: "Large",
    // Composite type
    shippingAddress: {
      street: "1084 Candycane Lane",
      city: "Silverlake",
      zip: "84323",
    },
    // Embedded optional type, set to null
    billingAddress: {
      set: null,
    },
  },
});
```

要对产品包含多张照片列表的情况进行建模，您可以一次设置多个合成类型：

```ts
const product = await prisma.product.create({
  data: {
    name: "Forest Runners",
    price: 59.99,
    colors: ["Red", "Green"],
    sizes: ["Small", "Medium", "Large"],
    // New composite type
    photos: {
      set: [
        { height: 100, width: 200, url: "1.jpg" },
        { height: 100, width: 200, url: "2.jpg" },
      ],
    },
  },
});
```

您还可以使用速记符号，省略集合并仅指定要创建的字段：

```ts
const product = await prisma.product.create({
  data: {
    name: "Forest Runners",
    price: 59.99,
    // Scalar lists that we already support
    colors: ["Red", "Green"],
    sizes: ["Small", "Medium", "Large"],
    // New composite type
    photos: [
      { height: 100, width: 200, url: "1.jpg" },
      { height: 100, width: 200, url: "2.jpg" },
    ],
  },
});
```

这些操作也在 `createMany` 方法中工作。例如，您可以创建多个产品，每个产品都包含照片列表：

```ts
const product = await prisma.product.createMany({
  data: [
    {
      name: "Forest Runners",
      price: 59.99,
      colors: ["Red", "Green"],
      sizes: ["Small", "Medium", "Large"],
      photos: [
        { height: 100, width: 200, url: "1.jpg" },
        { height: 100, width: 200, url: "2.jpg" },
      ],
    },
    {
      name: "Alpine Blazers",
      price: 85.99,
      colors: ["Blue", "Red"],
      sizes: ["Large", "XLarge"],
      photos: [
        { height: 100, width: 200, url: "1.jpg" },
        { height: 150, width: 200, url: "4.jpg" },
        { height: 200, width: 200, url: "5.jpg" },
      ],
    },
  ],
});
```

#### 在 `update` 和 `updateMany` 中更改复合类型 ​

**INFO:**
_当您使用具有唯一限制的复合类型更新记录时，请注意，MongoDB 不会强制记录内的值唯一。[了解更多](https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/composite-types#duplicate-values-in-unique-fields-of-composite-types)。_
可以在 `update` 或 `updateMany` 方法中设置、更新或删除复合类型。

##### 更改单个复合类型 ​

使用 ` set``、unset ` `update` 和 `upsert` 操作来更改单个复合类型：

- 使用 `set` 设置复合类型，覆盖任何现有值
- 使用 `unset` 取消设置复合类型。与 `set: null` 不同，`unset` 会完全删除该字段
- 使用 `update` 更新复合类型
- 使用 `upsert` 更新现有复合类型（如果存在），否则设置复合类型

例如，使用 `update` 将所需的 ShippingAddress 更新为订单中的地址复合类型：

```ts
const order = await prisma.order.update({
  where: {
    id: "some-object-id",
  },
  data: {
    shippingAddress: {
      // Update just the zip field
      update: {
        zip: "41232",
      },
    },
  },
});
```

对于可选的嵌入类型，例如 billingAddress，如果新记录不存在，请使用 `upsert` 创建新记录，如果存在则更新记录：

```ts
const order = await prisma.order.update({
  where: {
    id: "some-object-id",
  },
  data: {
    billingAddress: {
      // Create the address if it doesn't exist,
      // otherwise update it
      upsert: {
        set: {
          street: "1084 Candycane Lane",
          city: "Silverlake",
          zip: "84323",
        },
        update: {
          zip: "84323",
        },
      },
    },
  },
});
```

您还可以使用 `unset` 操作来删除可选的嵌入类型。
以下示例使用 `unset` 从订单中删除 billingAddress：

```ts
const order = await prisma.order.update({
  where: {
    id: "some-object-id",
  },
  data: {
    billingAddress: {
      // Unset the billing address
      // Removes "billingAddress" field from order
      unset: true,
    },
  },
});
```

您可以使用 `updateMany` 中的过滤器来更新与复合类型匹配的所有记录。
以下示例使用 `is` 过滤器来匹配订单列表中送货地址的街道名称：

```ts
const orders = await prisma.order.updateMany({
  where: {
    shippingAddress: {
      is: {
        street: "555 Candy Cane Lane",
      },
    },
  },
  data: {
    shippingAddress: {
      update: {
        street: "111 Candy Cane Drive",
      },
    },
  },
});
```

##### 更改多种复合类型 ​

使用 `set`、`push`、`updateMany` 和 `deleteMany` 操作来更改复合类型列表：

- `set`：设置复合类型的嵌入列表，覆盖任何现有列表
- `push`:将值推送到复合类型嵌入列表的末尾
- `updateMany`：一次更新多个复合类型
- `deleteMany`：一次删除多个复合类型

例如，使用`push`将新照片添加到照片列表中：

```ts
const product = prisma.product.update({
  where: {
    id: "62de6d328a65d8fffdae2c18",
  },
  data: {
    photos: {
      // Push a photo to the end of the photos list
      push: [{ height: 100, width: 200, url: "1.jpg" }],
    },
  },
});
```

使用 `updateMany` 更新 url 为 1.jpg 或 2.png 的照片：

```ts
const product = prisma.product.update({
  where: {
    id: "62de6d328a65d8fffdae2c18",
  },
  data: {
    photos: {
      updateMany: {
        where: {
          url: "1.jpg",
        },
        data: {
          url: "2.png",
        },
      },
    },
  },
});
```

以下示例使用`deleteMany`删除所有高度为 100 的照片：

```ts
const product = prisma.product.update({
  where: {
    id: "62de6d328a65d8fffdae2c18",
  },
  data: {
    photos: {
      deleteMany: {
        where: {
          height: 100,
        },
      },
    },
  },
});
```

#### 使用 `upsert` 更新插入复合类型 ​

**INFO:**
_当您创建或更新具有唯一限制的复合类型中的值时，请注意，MongoDB 不会在记录内强制执行唯一值。[了解更多](https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/composite-types#duplicate-values-in-unique-fields-of-composite-types)。_

要创建或更新复合类型，请使用 `upsert` 方法。您可以使用与上面的`create`和`update`方法相同的复合操作。

例如，使用 `upsert` 创建新产品或将照片添加到现有产品：

```ts
const product = await prisma.product.upsert({
  where: {
    name: "Forest Runners",
  },
  create: {
    name: "Forest Runners",
    price: 59.99,
    colors: ["Red", "Green"],
    sizes: ["Small", "Medium", "Large"],
    photos: [
      { height: 100, width: 200, url: "1.jpg" },
      { height: 100, width: 200, url: "2.jpg" },
    ],
  },
  update: {
    photos: {
      push: { height: 300, width: 400, url: "3.jpg" },
    },
  },
});
```

#### 使用 `delete` 和 `deleteMany` 删除包含复合类型的记录 ​

要删除嵌入复合类型的记录，请使用 `delete` 或 `deleteMany` 方法。这也将删除嵌入的复合类型。
例如，使用 `deleteMany` 删除所有尺寸为“Small”的产品。这也将删除所有嵌入的照片。

```ts
const deleteProduct = await prisma.product.deleteMany({
  where: {
    sizes: {
      equals: "Small",
    },
  },
});
```

您还可以使用过滤器删除与复合类型匹配的记录。
下面的示例使用 `some` 过滤器删除包含特定照片的产品：

```ts
const product = await prisma.product.deleteMany({
  where: {
    photos: {
      some: {
        url: "2.jpg",
      },
    },
  },
});
```

#### 排序复合类型 ​

您可以使用 `orderBy` 操作对结果进行升序或降序排序。
例如，以下命令查找所有订单，并按送货地址中的城市名称升序对它们进行排序：

```ts
const orders = await prisma.order.findMany({
  orderBy: {
    shippingAddress: {
      city: "asc",
    },
  },
});
```

#### 复合类型的唯一字段中的重复值 ​

对具有唯一约束的复合类型的记录执行以下任何操作时请务必小心。在这种情况下，MongoDB 不会强制记录内的值唯一。

- 当您创建记录时
- 当您向记录添加数据时
- 当您更新记录中的数据时

如果您的架构具有带有 `@@unique` 约束的复合类型，MongoDB 会阻止您在包含此复合类型的两个或多个记录中存储相同的约束值值。但是，MongoDB 并不阻止您在单个记录中存储同一字段值的多个副本。
请注意，您可以[使用 Prisma ORM 关系来解决此问题](https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/composite-types#use-prisma-orm-relations-to-enforce-unique-values-in-a-record)。

例如，在以下架构中，MailBox 有一个复合类型，即地址，它对电子邮件字段有 `@@unique` 约束。

```ts
type Address {
  email String
}

model MailBox {
  name      String
  addresses Address[]

  @@unique([addresses.email])
}
```

以下代码创建一条记录，其中地址中有两个相同的值。在这种情况下，MongoDB 不会抛出错误，并且它将 alice@prisma.io 存储在地址中两次。

```ts
await prisma.MailBox.createMany({
  data: [
    {
      name: "Alice",
      addresses: {
        set: [
          {
            address: "alice@prisma.io", // Not unique
          },
          {
            address: "alice@prisma.io", // Not unique
          },
        ],
      },
    },
  ],
});
```

**注意：**
_如果您尝试在两个单独的记录中存储相同的值，MongoDB 会抛出错误。在上面的示例中，如果您尝试存储用户 Alice 和用户 Bob 的电子邮件地址 alice@prisma.io，MongoDB 不会存储数据并引发错误。_

##### 使用 Prisma ORM 关系在记录中强制执行唯一值 ​

在上面的示例中，MongoDB 没有对嵌套地址名称强制执行唯一约束。但是，您可以对数据进行不同的建模，以在记录中强制使用唯一值。为此，请使用 Prisma ORM 关系将复合类型转换为集合。设置与该集合的关系，并对您想要唯一的字段施加唯一约束。
在以下示例中，MongoDB 在记录中强制执行唯一值。邮箱和地址模型之间存在关系。此外，Address 模型中的名称字段具有唯一约束。

```prisma
model Address {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  name      String
  mailbox   Mailbox? @relation(fields: [mailboxId], references: [id])
  mailboxId String?  @db.ObjectId

  @@unique([name])
}

model Mailbox {
  id        String    @id @default(auto()) @map("_id") @db.ObjectId
  name      String
  addresses Address[] @relation
}
```

```ts
await prisma.MailBox.create({
  data: {
    name: 'Alice',
    addresses: {
      create: [
        { name: 'alice@prisma.io' }, // Not unique
        { name: 'alice@prisma.io' }, // Not unique
      ],
    },
  },
}
```

如果运行上面的代码，MongoDB 会强制执行唯一约束。它不允许您的应用程序添加两个名为 alice@prisma.io 的地址。

#### Null and undefined

**WARNING:**
_在 Prisma ORM 5.20.0 之前，未定义被视为特殊值，不会包含在生成的查询中。此行为可能会导致意外结果和数据丢失。如果您使用的是旧版本的 Prisma ORM，我们强烈建议更新到 5.20.0 或更高版本，以利用新的 strictUndefinedChecks 功能。_

##### 严格的未定义检查（预览功能）​

要启用此功能，请将以下内容添加到您的 Prisma 架构中：

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["strictUndefinedChecks"]
}
```

##### 使用严格的未定义检查 ​

当此功能启用时：

1. 在查询中显式将字段设置为`undefined`将导致运行时错误。
2. 要跳过查询中的字段，请使用新的 `Prisma.skip` 符号而不是`undefined`

```ts
// This will throw an error
prisma.user.create({
  data: {
    name: "Alice",
    email: undefined, // Error: Cannot explicitly use undefined here
  },
});

// Use `Prisma.skip` (a symbol provided by Prisma) to omit a field
prisma.user.create({
  data: {
    name: "Alice",
    email: Prisma.skip, // This field will be omitted from the query
  },
});
```

此更改有助于防止意外删除或更新，例如：

```ts
// Before: This would delete all users
prisma.user.deleteMany({
  where: {
    id: undefined,
  },
});

// After: This will throw an error
// Invalid \`prisma.user.deleteMany()\` invocation in
// /client/tests/functional/strictUndefinedChecks/test.ts:0:0
//   XX })
//   XX
//   XX test('throws on undefined input field', async () => {
// → XX   const result = prisma.user.deleteMany({
//          where: {
//            id: undefined
//                ~~~~~~~~~
//          }
//        })
// Invalid value for argument \`where\`: explicitly \`undefined\` values are not allowed."
```

##### 迁移现有代码

```ts
// Before
let optionalEmail: string | undefined;

prisma.user.create({
  data: {
    name: "Alice",
    email: optionalEmail,
  },
});

// After
prisma.user.create({
  data: {
    name: "Alice",
    email: optionalEmail ?? Prisma.skip,
  },
});
```

这一新行为旨在成为 Prisma ORM 6 中的默认行为。

##### 迁移现有代码

除了 `strictUndefinedChecks` 之外，我们还建议启用 TypeScript 编译器选项 `exactOptionalPropertyTypes`。此选项强制可选属性必须完全匹配，这可以帮助捕获代码中未定义值的潜在问题。虽然 `strictUndefineChecks` 会因无效的未定义使用而引发运行时错误，但 `exactOptionalPropertyTypes` 将在构建过程中捕获这些问题。
在 [TypeScript 文档中了解有关 excactOptionalPropertyTypes 的更多信息](https://www.typescriptlang.org/tsconfig/#exactOptionalPropertyTypes)。

##### 遗留行为 ​

Prisma 客户端区分 `null` 和 `undefined`：

- `null` 是一个值
- `undefined`意味着什么也不做

**INFO:**
在具有 GraphQL 上下文的 Prisma ORM 中考虑这一点尤其重要，其中 `null` 和 `undefined` 是可以互换的。

#### Working with Json fields

##### 使用 Json 字段

使用 Json Prisma ORM 字段类型对底层数据库中的 JSON 类型进行读取、写入和执行基本过滤。在以下示例中，User 模型有一个名为 ExtendedPetsData 的可选 Json 字段：

```prisma
model User {
  id               Int     @id @default(autoincrement())
  email            String  @unique
  name             String?
  posts            Post[]
  extendedPetsData Json?
}
```

字段值示例：

```json
{
  "pet1": {
    "petName": "Claudine",
    "petType": "House cat"
  },
  "pet2": {
    "petName": "Sunny",
    "petType": "Gerbil"
  }
}
```

**NOTE:**
_仅当底层数据库具有相应的 JSON 数据类型时，才支持 Json 字段。_

Json 字段支持一些其他类型，例如字符串和布尔值。这些附加类型的存在是为了匹配 `JSON.parse()`
支持的类型：

```ts
export declare type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonArray;
```

###### JSON 字段的用例 ​

将数据存储为 JSON 而不是将数据表示为相关模型的原因包括：

- 您需要存储不具有一致结构的数据
- 您正在从另一个系统导入数据，并且不想将该数据映射到 Prisma 模型

##### 读取 Json 字段 ​

您可以使用 `Prisma.JsonArray` 和 `Prisma.JsonObject` 实用程序类来处理 Json 字段的内容：

```ts
const { PrismaClient, Prisma } = require("@prisma/client");

const user = await prisma.user.findFirst({
  where: {
    id: 9,
  },
});

// Example extendedPetsData data:
// [{ name: 'Bob the dog' }, { name: 'Claudine the cat' }]

if (
  user?.extendedPetsData &&
  typeof user?.extendedPetsData === "object" &&
  Array.isArray(user?.extendedPetsData)
) {
  const petsObject = user?.extendedPetsData as Prisma.JsonArray;

  const firstPet = petsObject[0];
}
```

[另请参阅：高级示例：更新嵌套 JSON 键值](https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-json-fields#advanced-example-update-a-nested-json-key-value)

##### 写入 Json 字段 ​

以下示例将 JSON 对象写入 ExtendedPetsData 字段：

```ts
var json = [
  { name: "Bob the dog" },
  { name: "Claudine the cat" },
] as Prisma.JsonArray;

const createUser = await prisma.user.create({
  data: {
    email: "birgitte@prisma.io",
    extendedPetsData: json,
  },
});
```

**NOTE:**
_JavaScript 对象（例如，{extendedPetsData: "none"}）会自动转换为 JSON。_
[另请参阅：高级示例：更新嵌套 JSON 键值](https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-json-fields#advanced-example-update-a-nested-json-key-value)

##### 对 Json 字段进行过滤（简单）​

您可以过滤 Json 类型的行。

###### 根据确切的字段值进行过滤 ​

以下查询返回 ExtendedPetsData 的值与 json 变量完全匹配的所有用户：

```ts
var json = { [{ name: 'Bob the dog' }, { name: 'Claudine the cat' }] }

const getUsers = await prisma.user.findMany({
  where: {
    extendedPetsData: {
      equals: json,
    },
  },
})
```

以下查询返回 ExtendedPetsData 的值与 json 变量不完全匹配的所有用户：

```ts
var json = {
  extendedPetsData: [{ name: "Bob the dog" }, { name: "Claudine the cat" }],
};

const getUsers = await prisma.user.findMany({
  where: {
    extendedPetsData: {
      not: json,
    },
  },
});
```

##### 对 Json 字段进行过滤（高级）​

您还可以按 Json 字段内的数据过滤行。我们称之为高级 Json 过滤。 仅 PostgreSQL 和 MySQL 支持此功能，且路径选项的语法不同。
**WARNING:**
_[PostgreSQL 不支持对数组中的对象键值进行过滤。](https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-json-fields#filtering-on-object-key-value-inside-array)_

###### 路径语法取决于数据库 ​

下面的过滤器使用路径选项来选择要过滤的 Json 值的特定部分。连接器之间的过滤实现有所不同：

- [MySQL 连接器](https://www.prisma.io/docs/orm/overview/databases/mysql)使用[MySQL 实现的 JSON 路径](https://dev.mysql.com/doc/refman/8.0/en/json.html#json-path-syntax)
- [PostgreSQL 连接器](https://www.prisma.io/docs/orm/overview/databases/mysql)使用自定义的 JSON 函数和[支持版本 12 和更早期的版本操作符](https://www.postgresql.org/docs/11/functions-json.html)

例如，以下是有效的 MySQL 路径值：
`$petFeatures.petName`

以下是有效的 PostgreSQL 路径值：
`["petFeatures", "petName"]`

###### 对对象属性进行过滤 ​

您可以过滤 JSON 块内的特定属性。
在以下示例中，extendedPetsData 的值是一维、未嵌套的 JSON 对象：

```json
{
  "petName": "Claudine",
  "petType": "House cat"
}
```

以下查询返回 petName 值为“Claudine”的所有用户：
PostgreSQL:

```ts
const getUsers = await prisma.user.findMany({
  where: {
    extendedPetsData: {
      path: ["petName"],
      equals: "Claudine",
    },
  },
});
```

MySQL:

```ts
const getUsers = await prisma.user.findMany({
  where: {
    extendedPetsData: {
      path: "$.petName",
      equals: "Claudine",
    },
  },
});
```

以下查询返回 petType 值包含“cat”的所有用户：
PostgreSQL:

```ts
const getUsers = await prisma.user.findMany({
  where: {
    extendedPetsData: {
      path: ["petType"],
      string_contains: "cat",
    },
  },
});
```

MySQL:

```ts
const getUsers = await prisma.user.findMany({
  where: {
    extendedPetsData: {
      path: ["petType"],
      string_contains: "cat",
    },
  },
});
```

以下字符串过滤器可用：

- [string_contains](https://www.prisma.io/docs/orm/reference/prisma-client-reference#string_contains)
- [string_starts_with](https://www.prisma.io/docs/orm/reference/prisma-client-reference#string_starts_with)
- [string_ends_with](https://www.prisma.io/docs/orm/reference/prisma-client-reference#string_ends_with)

###### 过滤嵌套对象属性 ​ ​

您可以过滤嵌套的 JSON 属性。在以下示例中，extendedPetsData 的值是一个具有多层嵌套的 JSON 对象。

```json
{
  "pet1": {
    "petName": "Claudine",
    "petType": "House cat"
  },
  "pet2": {
    "petName": "Sunny",
    "petType": "Gerbil",
    "features": {
      "eyeColor": "Brown",
      "furColor": "White and black"
    }
  }
}
```

以下查询返回“pet2”→“petName”为“Sunny”的所有用户：
PostgreSQL:

```ts
const getUsers = await prisma.user.findMany({
  where: {
    extendedPetsData: {
      path: ["pet2", "petName"],
      equals: "Sunny",
    },
  },
});
```

MySQL:

```ts
const getUsers = await prisma.user.findMany({
  where: {
    extendedPetsData: {
      path: "$.pet2.petName",
      equals: "Sunny",
    },
  },
});
```

以下查询返回所有用户，其中：
PostgreSQL:

```ts
const getUsers = await prisma.user.findMany({
  where: {
    AND: [
      {
        extendedPetsData: {
          path: ["pet2", "petName"],
          equals: "Sunny",
        },
      },
      {
        extendedPetsData: {
          path: ["pet2", "features", "furColor"],
          string_contains: "black",
        },
      },
    ],
  },
});
```

MySQL:

```ts
const getUsers = await prisma.user.findMany({
  where: {
    AND: [
      {
        extendedPetsData: {
          path: "$.pet2.petName",
          equals: "Sunny",
        },
      },
      {
        extendedPetsData: {
          path: "$.pet2.features.furColor",
          string_contains: "black",
        },
      },
    ],
  },
});
```

###### 对数组值进行过滤 ​

您可以过滤标量数组（字符串、整数）中是否存在特定值。在以下示例中，extendedPetsData 的值是一个字符串数组：
`["Claudine", "Sunny"]`

以下查询返回拥有名为“Claudine”的宠物的所有用户：
PostgreSQL:

```ts
const getUsers = await prisma.user.findMany({
  where: {
    extendedPetsData: {
      array_contains: ["Claudine"],
    },
  },
});
```

**INFO:**
_在 PostgreSQL 中，array_contains 的值必须是数组而不是字符串，即使数组仅包含单个值。_
MySQL:

```ts
const getUsers = await prisma.user.findMany({
  where: {
    extendedPetsData: {
      array_contains: "Claudine",
    },
  },
});
```

可以使用以下数组过滤器：

- [array_contains](https://www.prisma.io/docs/orm/reference/prisma-client-reference#array_contains)
- [array_starts_with](https://www.prisma.io/docs/orm/reference/prisma-client-reference#array_starts_with)
- [array_ends_with](https://www.prisma.io/docs/orm/reference/prisma-client-reference#array_ends_with)

###### 过滤嵌套数组值 ​

您可以过滤标量数组（字符串、整数）中是否存在特定值。
在以下示例中，extendedPetsData 的值包括嵌套的名称标量数组：

```json
{
  "cats": { "owned": ["Bob", "Sunny"], "fostering": ["Fido"] },
  "dogs": { "owned": ["Ella"], "fostering": ["Prince", "Empress"] }
}
```

**标量值数组 ​**
以下查询返回养育名为“Fido”的猫的所有用户：
PostgreSQL:

```ts
const getUsers = await prisma.user.findMany({
  where: {
    extendedPetsData: {
      path: ["cats", "fostering"],
      array_contains: ["Fido"],
    },
  },
});
```

MySQL:

```ts
const getUsers = await prisma.user.findMany({
  where: {
    extendedPetsData: {
      path: "$.cats.fostering",
      array_contains: "Fido",
    },
  },
});
```

以下查询返回饲养名为“Fido”和“Bob”的猫的所有用户：
PostgreSQL:

```ts
const getUsers = await prisma.user.findMany({
  where: {
    extendedPetsData: {
      path: ["cats", "fostering"],
      array_contains: ["Fido", "Bob"],
    },
  },
});
```

MySQL:

```ts
const getUsers = await prisma.user.findMany({
  where: {
    extendedPetsData: {
      path: "$.cats.fostering",
      array_contains: ["Fido", "Bob"],
    },
  },
});
```

**JSON 对象数组 ​**
PostgreSQL:

```ts
const json = [{ status: "expired", insuranceID: 92 }];

const checkJson = await prisma.user.findMany({
  where: {
    extendedPetsData: {
      path: ["insurances"],
      array_contains: json,
    },
  },
});
```

MySQL:

```ts
const json = { status: "expired", insuranceID: 92 };

const checkJson = await prisma.user.findMany({
  where: {
    extendedPetsData: {
      path: "$.insurances",
      array_contains: json,
    },
  },
});
```

如果您使用 PostgreSQL，则必须传入一组要匹配的对象，即使该数组仅包含一个对象：
`[{ status: 'expired', insuranceID: 92 }]`

如果您使用 MySQL，则必须传入单个对象来匹配：
`{ status: 'expired', insuranceID: 92 }`

如果您的过滤器数组包含多个对象，PostgreSQL 将仅在所有对象都存在时才返回结果 - 如果至少存在一个对象则不会返回结果。

您必须将 array_contains 设置为 JSON 对象，而不是字符串。如果您使用字符串，Prisma Client 会转义引号，并且查询将不会返回结果。
例如：
`array_contains: '[{"status": "expired", "insuranceID": 92}]'`
被发送到数据库：`[{\"status\": \"expired\", \"insuranceID\": 92}]`

###### 通过索引定位数组元素 ​

您可以过滤特定位置的元素值。
`{ "owned": ["Bob", "Sunny"], "fostering": ["Fido"] }`

PostgreSQL:

```ts
const getUsers = await prisma.user.findMany({
  where: {
    comments: {
      path: ["owned", "1"],
      string_contains: "Bob",
    },
  },
});
```

MySQL:

```ts
const getUsers = await prisma.user.findMany({
  where: {
    comments: {
      path: "$.owned[1]",
      string_contains: "Bob",
    },
  },
});
```

###### 对数组内的对象键值进行过滤 ​

根据您的提供程序，您可以过滤数组内对象的键值。
**WARNING:**
_仅 [MySQL 数据库连接器](https://www.prisma.io/docs/orm/overview/databases/mysql)支持对数组中的对象键值进行过滤。但是，您仍然可以[过滤整个 JSON 对象的存在](https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-json-fields#json-object-arrays)。_

在以下示例中，extendedPetsData 的值是一个带有嵌套 Insurances 数组的对象数组，其中包含两个对象：

```json
[
  {
    "petName": "Claudine",
    "petType": "House cat",
    "insurances": [
      { "insuranceID": 92, "status": "expired" },
      { "insuranceID": 12, "status": "active" }
    ]
  },
  {
    "petName": "Sunny",
    "petType": "Gerbil"
  },
  {
    "petName": "Gerald",
    "petType": "Corn snake"
  },
  {
    "petName": "Nanna",
    "petType": "Moose"
  }
]
```

以下查询返回至少一只宠物是驼鹿的所有用户：

```ts
const getUsers = await prisma.user.findMany({
  where: {
    extendedPetsData: {
      path: "$[*].petType",
      array_contains: "Moose",
    },
  },
});
```

- `$[*]` 是 pet 对象的根数组
- `petType` 与任何宠物对象中的 `petType` 键匹配

以下查询返回至少一只宠物的保险已过期的所有用户：

```ts
const getUsers = await prisma.user.findMany({
  where: {
    extendedPetsData: {
      path: "$[*].insurances[*].status",
      array_contains: "expired",
    },
  },
});
```

- `$[*]` 是 pet 对象的根数组
- `Insurances[*]` 匹配任何宠物对象内的任何 Insurances 数组
- `status`与任何保险对象中的任何状态键匹配

##### 高级示例：更新嵌套 JSON 键值 ​

```json
{
  "petName": "Claudine",
  "petType": "House cat",
  "insurances": [
    { "insuranceID": 92, "status": "expired" },
    { "insuranceID": 12, "status": "active" }
  ]
}
```

下面的例子： 1.获取所有用户 2.将各保险对象的“状态”更改为“过期” 3.获取所有保险已过期且 ID 为 92 的用户

PostgreSQL:

```ts
const userQueries: string | any[] = [];

getUsers.forEach((user) => {
  if (
    user.extendedPetsData &&
    typeof user.extendedPetsData === "object" &&
    !Array.isArray(user.extendedPetsData)
  ) {
    const petsObject = user.extendedPetsData as Prisma.JsonObject;

    const i = petsObject["insurances"];

    if (i && typeof i === "object" && Array.isArray(i)) {
      const insurancesArray = i as Prisma.JsonArray;

      insurancesArray.forEach((i) => {
        if (i && typeof i === "object" && !Array.isArray(i)) {
          const insuranceObject = i as Prisma.JsonObject;

          insuranceObject["status"] = "expired";
        }
      });

      const whereClause = Prisma.validator<Prisma.UserWhereInput>()({
        id: user.id,
      });

      const dataClause = Prisma.validator<Prisma.UserUpdateInput>()({
        extendedPetsData: petsObject,
      });

      userQueries.push(
        prisma.user.update({
          where: whereClause,
          data: dataClause,
        })
      );
    }
  }
});

if (userQueries.length > 0) {
  console.log(userQueries.length + " queries to run!");
  await prisma.$transaction(userQueries);
}

const json = [{ status: "expired", insuranceID: 92 }];

const checkJson = await prisma.user.findMany({
  where: {
    extendedPetsData: {
      path: ["insurances"],
      array_contains: json,
    },
  },
});

console.log(checkJson.length);
```

MySQL:

```ts
const userQueries: string | any[] = [];

getUsers.forEach((user) => {
  if (
    user.extendedPetsData &&
    typeof user.extendedPetsData === "object" &&
    !Array.isArray(user.extendedPetsData)
  ) {
    const petsObject = user.extendedPetsData as Prisma.JsonObject;

    const insuranceList = petsObject["insurances"]; // is a Prisma.JsonArray

    if (Array.isArray(insuranceList)) {
      insuranceList.forEach((insuranceItem) => {
        if (
          insuranceItem &&
          typeof insuranceItem === "object" &&
          !Array.isArray(insuranceItem)
        ) {
          insuranceItem["status"] = "expired"; // is a  Prisma.JsonObject
        }
      });

      const whereClause = Prisma.validator<Prisma.UserWhereInput>()({
        id: user.id,
      });

      const dataClause = Prisma.validator<Prisma.UserUpdateInput>()({
        extendedPetsData: petsObject,
      });

      userQueries.push(
        prisma.user.update({
          where: whereClause,
          data: dataClause,
        })
      );
    }
  }
});

if (userQueries.length > 0) {
  console.log(userQueries.length + " queries to run!");
  await prisma.$transaction(userQueries);
}

const json = { status: "expired", insuranceID: 92 };

const checkJson = await prisma.user.findMany({
  where: {
    extendedPetsData: {
      path: "$.insurances",
      array_contains: json,
    },
  },
});

console.log(checkJson.length);
```

##### 使用空值 ​​

SQL 数据库中的 JSON 字段可能有两种类型的空值。

- 数据库 `NULL`：数据库中的值为`NULL`。
- JSON `null`：数据库中的值包含为 `null` 的 JSON 值。

为了区分这些可能性，我们引入了三个您可以使用的空枚举：

- `JsonNull`：表示 JSON 中的空值。
- `DbNull`：表示数据库中的 NULL 值。
- `AnyNull`：表示 null JSON 值和 NULL 数据库值。 （仅当过滤时）

**INFO:**

- _使用任何空枚举进行过滤时，您不能使用简写并关闭等于运算符。_
- _这些 `null` 枚举不适用于 MongoDB，因为 `JSON null` 和`数据库 NULL` 之间不存在差异。_
- _`null` 枚举不适用于所有数据库中的 `array_contains` 运算符，因为 JSON 数组中只能存在 `JSON null`。由于 JSON 数组中不能存在`数据库 NULL`，因此 { array_contains: null } 是明确的。_

```prisma
model Log {
  id   Int  @id
  meta Json
}
```

下面是使用 `AnyNull` 的示例：

```ts
import { Prisma } from "@prisma/client";

prisma.log.findMany({
  where: {
    data: {
      meta: {
        equals: Prisma.AnyNull,
      },
    },
  },
});
```

###### 插入空值

这也适用于`create`、`update`和`upsert`。要将`null`插入 Json 字段，您可以编写：

```ts
import { Prisma } from "@prisma/client";

prisma.log.create({
  data: {
    meta: Prisma.JsonNull,
  },
});
```

要将`数据库 NULL` 插入 Json 字段，您可以编写：

```ts
import { Prisma } from "@prisma/client";

prisma.log.create({
  data: {
    meta: Prisma.DbNull,
  },
});
```

###### 按空值过滤

要按 `JsonNull` 或 `DbNull` 进行过滤，您可以编写：

```ts
import { Prisma } from "@prisma/client";

prisma.log.findMany({
  where: {
    meta: {
      equals: Prisma.AnyNull,
    },
  },
});
```

##### 类型化 Json​

默认情况下，Prisma 模型中不会输入 Json 字段。要在这些字段内实现强类型，您需要使用像 [prisma-json-types-generator](https://www.npmjs.com/package/prisma-json-types-generator)这样的外部包来完成此操作。

**使用 prisma-json-types-generator​**

1. 首先，根据包的说明安装和配置 prisma-json-types-generator。

2. 然后，假设您有一个如下所示的模型：
   您可以使用抽象语法树注释来更新和键入它

```prisma
model Log {
  id   Int  @id
  /// [LogMetaType]
  meta Json
}
```

3. 然后，确保在 tsconfig.json 中包含的类型声明文件中定义上述类型

```ts
declare global {
  namespace PrismaJson {
    type LogMetaType = { timestamp: number; host: string };
  }
}
```

现在，当使用 Log.meta 时，它将是强类型的！

您可以选择要返回的 JSON 键/值的子集吗？

##### Json 常见问题解答

- 您可以选择要返回的 JSON 键/值的子集吗？​
  否 - 尚无法选择要返回哪些 JSON 元素。 Prisma 客户端返回整个 JSON 对象。

- 您可以过滤特定键的存在吗？​
  否 - 尚无法过滤特定密钥的存在。

- 是否支持不区分大小写的过滤？​
  否 - 尚不支持不区分大小写的过滤。

- 如何设置 JSON 字段的默认值？​
  当您想要设置 `Json` 类型的 `@default` 值时，需要在 `@default` 属性内用双引号将其括起来（并可能使用反斜杠转义任何“内部”双引号），例如：

```prisma
model User {
  id    Int  @id @default(autoincrement())
  json1 Json @default("[]")
  json2 Json @default("{ \"hello\": \"world\" }")
}
```

#### Working with scalar lists

标量列表由 [] 修饰符表示，并且仅在基础数据库支持标量列表时才可用。以下示例有一个名为 pets 的标量字符串列表：

```prisma
model User {
  id   Int      @id @default(autoincrement())
  name String
  pets String[]
}
```

##### 设置标量列表的值 ​

以下示例演示了如何在创建模型时设置标量列表 (coinflips) 的值：

```ts
const createdUser = await prisma.user.create({
  data: {
    email: "eloise@prisma.io",
    coinflips: [true, true, true, false, true],
  },
});
```

##### 取消设置标量列表的值 ​ ​

以下示例演示如何取消设置标量列表 (coinflips) 的值：

```ts
const createdUser = await prisma.user.create({
  data: {
    email: "eloise@prisma.io",
    coinflips: {
      unset: true,
    },
  },
});
```

与 `set: null` 不同，`unset` 会完全删除列表。

##### 将项目添加到标量列表 ​

使用 `push` 方法将单个值添加到标量列表：

```ts
const userUpdate = await prisma.user.update({
  where: {
    id: 9,
  },
  data: {
    coinflips: {
      push: true,
    },
  },
});
```

##### 过滤标量列表 ​ ​

使用标量列表过滤器来过滤具有与特定条件匹配的标量列表的记录。
以下示例返回标签列表包含数据库和打字稿的所有帖子：

```ts
const posts = await prisma.post.findMany({
  where: {
    tags: {
      hasEvery: ["databases", "typescript"],
    },
  },
});
```

###### 数组中的 `NULL` 值 ​ ​

将标量列表过滤器与关系数据库连接器一起使用时，以下条件不考虑具有 `NULL` 值的数组字段：

- `NOT`（数组不包含 X）
- `isEmpty`（数组为空）

这意味着您可能期望看到的记录不会返回。考虑以下示例：
以下查询返回标签不包含数据库的所有帖子：

```ts
const posts = await prisma.post.findMany({
  where: {
    NOT: {
      tags: {
        has: "databases",
      },
    },
  },
});
```

- 不包含“数据库”的数组，例如 {"typescript", "graphql"}
- 空数组，如[]

查询不返回：
`NULL` 数组，即使它们不包含“数据库”

#### Working with compound IDs and unique constraints

可以使用 `@@id` 和 `@@unique` 属性在 Prisma 架构中定义复合 ID 和复合唯一约束。
**WARNING:**
_MongoDB 不支持`@@id` MongoDB 不支持复合 ID，这意味着您无法识别具有 `@@id` 属性的模型。_
复合 ID 或复合唯一约束使用两个字段的组合值作为数据库表中的主键或标识符。
在以下示例中，postId 字段和 userId 字段用作 Like 表的复合 ID：

```prisma
model User {
  id    Int    @id @default(autoincrement())
  name  String
  post  Post[]
  likes Like[]
}

model Post {
  id      Int    @id @default(autoincrement())
  content String
  User    User?  @relation(fields: [userId], references: [id])
  userId  Int?
  likes   Like[]
}

model Like {
  postId Int
  userId Int
  User   User @relation(fields: [userId], references: [id])
  Post   Post @relation(fields: [postId], references: [id])

  @@id([postId, userId])
}
```

从 Like 表中查询记录（例如使用 prisma.like.findMany()）将返回如下所示的对象：

```json
{
  "postId": 1,
  "userId": 1
}
```

尽管响应中只有两个字段，但这两个字段组成了一个名为 postId_userId 的复合 ID。

您还可以使用`@@id` 或`@@unique` 属性的名称字段创建命名复合 ID 或复合唯一约束。例如：

```prisma
model Like {
  postId Int
  userId Int
  User   User @relation(fields: [userId], references: [id])
  Post   Post @relation(fields: [postId], references: [id])

  @@id(name: "likeId", [postId, userId])
}
```

##### 您可以在哪里使用复合 ID 和唯一约束 ​

处理唯一数据时可以使用复合 ID 和复合唯一约束。
以下是在查询的 where 过滤器中接受复合 ID 或复合唯一约束的 Prisma 客户端函数列表：

- findUnique()
- findUniqueOrThrow
- delete
- update
- upsert

使用 `connect` 和 `connectOrCreate` 创建关系数据时，也可以使用复合 ID 和复合唯一约束。

##### 通过复合 ID 或唯一约束过滤记录 ​

尽管您的查询结果不会将复合 ID 或唯一约束显示为字段，但您可以使用这些复合值来过滤查询以获取唯一记录：

```ts
const like = await prisma.like.findUnique({
  where: {
    likeId: {
      userId: 1,
      postId: 1,
    },
  },
});
```

**INFO:**
_请注意，复合 ID 和复合唯一约束键仅可用作唯一查询（例如 `findUnique()` 和 `findUniqueOrThrow`）的筛选选项。有关可以使用这些字段的位置的列表，请参阅上面的部分。_

##### 通过复合 ID 或唯一约束删除记录 ​

复合 ID 或复合唯一约束可以用在`delete`查询的 `where` 过滤器中：

```ts
const like = await prisma.like.delete({
  where: {
    likeId: {
      userId: 1,
      postId: 1,
    },
  },
});
```

##### 通过复合 ID 或唯一约束更新和更新插入记录 ​

复合 ID 或复合唯一约束可以用在`update`的 `where` 过滤器中：

```ts
const like = await prisma.like.update({
  where: {
    likeId: {
      userId: 1,
      postId: 1,
    },
  },
  data: {
    postId: 2,
  },
});
```

它们也可以用在 `upsert` 查询的 `where` 过滤器中：

```ts
await prisma.like.upsert({
  where: {
    likeId: {
      userId: 1,
      postId: 1,
    },
  },
  update: {
    userId: 2,
  },
  create: {
    userId: 2,
    postId: 1,
  },
});
```

##### 通过复合 ID 或唯一约束过滤关系查询 ​

复合 ID 和复合唯一约束也可以用在连接记录以创建关系时使用的 `connect` 和 `connectOrCreate` 键中。

```ts
await prisma.user.create({
  data: {
    name: "Alice",
    likes: {
      connect: {
        likeId: {
          postId: 1,
          userId: 2,
        },
      },
    },
  },
});
```

likeId 复合 ID 用作`connect`对象中的标识符，该连接对象用于定位将链接到新用户“Alice”的 Like 表记录。

类似地，likeId 可以在 `connectOrCreate` 的 `where` 过滤器中使用，以尝试在 Like 表中查找现有记录：

```ts
await prisma.user.create({
  data: {
    name: "Alice",
    likes: {
      connectOrCreate: {
        create: {
          postId: 1,
        },
        where: {
          likeId: {
            postId: 1,
            userId: 1,
          },
        },
      },
    },
  },
});
```

## extensions

您可以使用 Prisma 客户端扩展向模型、结果对象和查询添加功能，或添加客户端级方法。
您可以使用以下一种或多种组件类型创建扩展：

- `model`：将自定义方法或字段添加到模型中
- `client`：向 Prisma 客户端添加客户端级方法
- `query`：创建自定义 Prisma 客户端查询
- `result`：将自定义字段添加到查询结果中

### 关于 Prisma 客户端扩展 ​

当您使用 Prisma 客户端扩展时，您将创建一个扩展客户端。扩展客户端是标准 Prisma 客户端的轻量级变体，由一个或多个扩展封装。标准客户端没有发生变化。您可以根据需要向项目中添加任意数量的扩展客户端。[了解有关扩展客户的更多信息](https://www.prisma.io/docs/orm/prisma-client/client-extensions#extended-clients)。

您可以将单个分机或多个分机与扩展客户端关联。[了解有关多个扩展的更多信息](https://www.prisma.io/docs/orm/prisma-client/client-extensions#multiple-extensions)。

您可以[与其他 Prisma ORM 用户共享您的 Prisma Client 扩展](https://www.prisma.io/docs/orm/prisma-client/client-extensions/shared-extensions)，并[将其他用户开发的 Prisma Client 扩展导入到您的 Prisma ORM 项目中](https://www.prisma.io/docs/orm/prisma-client/client-extensions/shared-extensions#install-a-shared-packaged-extension)。

#### 扩展客户 ​

扩展客户端相互交互以及与标准客户端交互，如下所示：

- 每个扩展客户端在隔离实例中独立运行。
- 扩展客户端不能相互冲突，也不能与标准客户端冲突。
- 所有扩展客户端和标准客户端都使用相同的 [Prisma ORM 查询引擎](https://www.prisma.io/docs/orm/more/under-the-hood/engines)进行通信。
- 所有扩展客户端和标准客户端共享相同的连接池。

**NOTE:**
_扩展的作者可以修改此行为，因为他们能够将任意代码作为扩展的一部分运行。例如，扩展实际上可能会创建一个全新的 PrismaClient 实例（包括其自己的查询引擎和连接池）。请务必检查您正在使用的扩展的文档，以了解它可能实现的任何特定行为。_

#### 扩展客户的示例用例 ​ ​

由于扩展客户端在隔离实例中运行，因此它们是执行以下操作的好方法，例如：

- 实现行级安全性 (RLS)，其中每个 HTTP 请求都有自己的客户端，并具有自己的 RLS 扩展，并使用会话数据进行自定义。这可以使每个用户完全独立，每个用户都在单独的客户端中。
- 为 User 模型添加 `user.current()` 方法以获取当前登录的用户。
- 如果设置了调试 cookie，则为请求启用更详细的日志记录。
- 将唯一的请求 ID 附加到所有日志，以便您稍后可以将它们关联起来，例如帮助您分析 Prisma 客户端执行的操作。
- 从模型中删除 `delete` 方法，除非应用程序调用管理端点并且用户具有必要的权限。

### 向 Prisma 客户端添加扩展 ​

您可以使用两种主要方式创建扩展：

- 使用客户端级别的 `$extends` 方法

```ts
const prisma = new PrismaClient().$extends({
  name: 'signUp', // Optional: name appears in error logs
  model: {        // This is a `model` component
    user: { ... } // The extension logic for the `user` model goes inside the curly braces
  },
})
```

- 使用 `Prisma.defineExtension` 方法定义扩展并将其分配给变量，然后将扩展传递给客户端级 `$extends` 方法

```ts
import { Prisma } from '@prisma/client'

// Define the extension
const myExtension = Prisma.defineExtension({
  name: 'signUp', // Optional: name appears in error logs
  model: {        // This is a `model` component
    user: { ... } // The extension logic for the `user` model goes inside the curly braces
  },
})

// Pass the extension to a Prisma Client instance
const prisma = new PrismaClient().$extends(myExtension)
```

**TIP:**
_当您想要将扩展分成项目内的多个文件或目录时，此模式非常有用。_

### 为错误日志命名扩展名 ​

您可以命名您的扩展以帮助在错误日志中识别它们。为此，请使用可选字段名称。例如：

```ts
const prisma = new PrismaClient().$extends({
  name: `signUp`,  // (Optional) Extension name
  model: {
    user: { ... }
 },
})
```

### 多种扩展 ​

您可以通过以下两种方式之一将扩展与扩展客户端关联：

- 您可以将其与扩展客户端单独关联，
- 您可以将扩展与其他扩展结合起来，并将所有这些扩展与扩展客户端相关联。这些组合扩展的功能适用于同一扩展客户端。**注意：组合扩展可能会发生冲突。**

#### [将多个扩展应用到扩展客户端 ​](https://www.prisma.io/docs/orm/prisma-client/client-extensions#apply-multiple-extensions-to-an-extended-client) ​

#### 组合扩展中的冲突 ​ ​

当您将两个或多个扩展组合成一个扩展客户端时，您声明的最后一个扩展在任何冲突中优先。在上面选项 1 的示例中，假设在扩展 A 中定义了一个名为 myExtensionMethod() 的方法，在扩展 B 中定义了一个名为 myExtensionMethod() 的方法。当您调用 prismaAB.myExtensionMethod() 时，Prisma 客户端将使用在 extensionB 中定义的 myExtensionMethod()。

### 扩展客户端的类型 ​

您可以使用 `typeof` 实用程序推断扩展 Prisma Client 实例的类型，如下所示：

```ts
const extendedPrismaClient = new PrismaClient().$extends({
  /** extension */
});

type ExtendedPrismaClient = typeof extendedPrismaClient;
```

如果您将 Prisma Client 作为单例使用，则可以使用 `typeof` 和 `ReturnType`实用程序获取扩展 Prisma Client 实例的类型，如下所示：

```ts
function getExtendedClient() {
  return new PrismaClient().$extends({
    /* extension */
  });
}

type ExtendedPrismaClient = ReturnType<typeof getExtendedClient>;
```

### 局限性 ​

#### 与扩展客户一起使用 `$on` 和 `$use​`

`$on` 和 `$use` 在扩展客户端中不可用。如果您想继续在扩展客户端中使用这些客户端级方法，则需要在扩展客户端之前将它们连接起来。

```ts
const prisma = new PrismaClient();

prisma.$use(async (params, next) => {
  console.log("This is middleware!");
  return next(params);
});

const xPrisma = prisma.$extends({
  name: "myExtension",
  model: {
    user: {
      async signUp(email: string) {
        await prisma.user.create({ data: { email } });
      },
    },
  },
});
```

要了解更多信息，请参阅有关 [$on](https://www.prisma.io/docs/orm/reference/prisma-client-reference#on) 和 [$use](https://www.prisma.io/docs/orm/reference/prisma-client-reference#use) 的文档

#### 在扩展客户端中使用客户端级方法 ​

客户端级方法不一定存在于扩展客户端上。对于这些客户端，您需要在使用之前首先检查是否存在。

```ts
const xPrisma = new PrismaClient().$extends(...);

if (xPrisma.$connect) {
  xPrisma.$connect()
}
```

#### 与嵌套操作一起使用 ​

查询扩展类型不支持嵌套读写操作。

### `model`：将自定义方法添加到模型中

您可以使用 `model` [Prisma 客户端扩展](https://www.prisma.io/docs/orm/prisma-client/client-extensions)组件类型将自定义方法添加到模型中。
模型组件的可能用途包括：

- 新操作将与现有 Prisma 客户端操作一起运行，例如 `findMany`
- 封装业务逻辑
- 重复操作
- 特定于模型的实用程序

#### 添加自定义方法 ​

使用 `$extends` [客户端级方法](https://www.prisma.io/docs/orm/reference/prisma-client-reference#client-methods)创建扩展客户端。扩展客户端是标准 Prisma 客户端的一种变体，由一个或多个扩展封装。使用`model`扩展组件向架构中的模型添加方法。

##### 向特定模型添加自定义方法 ​

要扩展架构中的特定模型，请使用以下结构。此示例向用户模型添加一个方法。

```ts
const prisma = new PrismaClient().$extends({
  name?: '<name>',  // (optional) names the extension for error logs
  model?: {
    user: { ... }   // in this case, we extend the `user` model
  },
});
```

###### 示例 ​

以下示例将一个名为 signUp 的方法添加到用户模型中。此方法使用指定的电子邮件地址创建一个新用户：

```ts
const prisma = new PrismaClient().$extends({
  model: {
    user: {
      async signUp(email: string) {
        await prisma.user.create({ data: { email } });
      },
    },
  },
});
```

您可以在应用程序中调用 signUp，如下所示：

```ts
const user = await prisma.user.signUp("john@prisma.io");
```

##### 向架构中的所有模型添加自定义方法 ​

要扩展架构中的所有模型，请使用以下结构：

```ts
const prisma = new PrismaClient().$extends({
  name?: '<name>', // `name` is an optional field that you can use to name the extension for error logs
  model?: {
    $allModels: { ... }
  },
})
```

###### 示例 ​

下面的示例向所有模型添加一个 exists 方法。

```ts
const prisma = new PrismaClient().$extends({
  model: {
    $allModels: {
      async exists<T>(
        this: T,
        where: Prisma.Args<T, "findFirst">["where"]
      ): Promise<boolean> {
        // Get the current model at runtime
        const context = Prisma.getExtensionContext(this);

        const result = await (context as any).findFirst({ where });
        return result !== null;
      },
    },
  },
});
```

您可以按如下方式在应用程序中调用存在：

```ts
// `exists` method available on all models
await prisma.user.exists({ name: "Alice" });
await prisma.post.exists({
  OR: [{ title: { contains: "Prisma" } }, { content: { contains: "Prisma" } }],
});
```

#### 从另一个自定义方法调用自定义方法 ​

如果两个方法是在同一模型上声明的，则可以从另一个自定义方法调用这两个方法。
例如，您可以从用户模型上的另一个自定义方法调用用户模型上的自定义方法。这两个方法是在同一扩展中还是在不同扩展中声明并不重要。

为此，请使用 `Prisma.getExtensionContext(this).methodName`。请注意，您不能使用 `prisma.user.methodName`。这是因为 prisma 尚未扩展，因此不包含新方法。

```ts
const prisma = new PrismaClient().$extends({
  model: {
    user: {
      firstMethod() {
        ...
      },
      secondMethod() {
          Prisma.getExtensionContext(this).firstMethod()
      }
    }
  }
})
```

#### 在运行时获取当前模型名称 ​

您可以在运行时使用 `Prisma.getExtensionContext(this).$name` 获取当前模型的名称。您可以使用它将模型名称写入日志、将名称发送到另一个服务或根据模型对代码进行分支。

```ts
// `context` refers to the current model
const context = Prisma.getExtensionContext(this);

// `context.name` returns the name of the current model
console.log(context.name);

// Usage
await(context as any).findFirst({ args });
```

有关在运行时检索当前模型名称的具体示例，[请参阅向架构中的所有模型添加自定义方法](https://www.prisma.io/docs/orm/prisma-client/client-extensions/model#example-1)。

#### 高级类型安全：用于定义通用扩展的类型实用程序 ​

您可以使用类型实用程序提高共享扩展中模型组件的[类型安全性](https://www.prisma.io/docs/orm/prisma-client/client-extensions/type-utilities)。

### `client`：向 Prisma 客户端添加方法

您可以使用客户端 [Prisma 客户端扩展组件](https://www.prisma.io/docs/orm/prisma-client/client-extensions)将顶级方法添加到 Prisma 客户端。

#### 扩展 Prisma 客户端 ​

使用 `$extends` [客户端级方法](https://www.prisma.io/docs/orm/reference/prisma-client-reference#client-methods)创建扩展客户端。扩展客户端是标准 Prisma 客户端的一种变体，由一个或多个扩展封装。使用客户端扩展组件将顶级方法添加到 Prisma 客户端。
要将顶级方法添加到 Prisma Client，请使用以下结构：

```ts
const prisma = new PrismaClient().$extends({
  client?: { ... }
})
```

##### 示例

以下示例使用客户端组件向 Prisma 客户端添加两个方法：

- `$log`输出一条消息。
- `$totalQueries`返回当前客户端实例执行的查询数。它使用指标功能来收集此信息。
  **INFO:**
  _要在项目中使用指标，您必须在 schema.prisma 文件的`generator`中启用`metrics`功能标志。[了解更多。](https://www.prisma.io/docs/orm/prisma-client/observability-and-logging/metrics#2-enable-the-feature-flag-in-the-prisma-schema-file)_

```ts
const prisma = new PrismaClient().$extends({
  client: {
    $log: (s: string) => console.log(s),
    async $totalQueries() {
      const index_prisma_client_queries_total = 0;
      // Prisma.getExtensionContext(this) in the following block
      // returns the current client instance
      const metricsCounters = await (
        await Prisma.getExtensionContext(this).$metrics.json()
      ).counters;

      return metricsCounters[index_prisma_client_queries_total].value;
    },
  },
});

async function main() {
  prisma.$log("Hello world");
  const totalQueries = await prisma.$totalQueries();
  console.log(totalQueries);
}
```

### `query`：创建自定义 Prisma 客户端查询

您可以使用 `query` [Prisma 客户端扩展](https://www.prisma.io/docs/orm/prisma-client/client-extensions)组件类型来挂钩查询生命周期并修改传入查询或其结果。

您可以使用 Prisma 客户端扩展查询组件来创建独立的客户端。这提供了[中间件](https://www.prisma.io/docs/orm/prisma-client/client-extensions/middleware)的替代方案。您可以将一个客户端绑定到特定过滤器或用户，并将另一个客户端绑定到另一个过滤器或用户。
例如，您可以执行此操作以在行级安全性 (RLS) 扩展中实现[用户隔离](https://www.prisma.io/docs/orm/prisma-client/client-extensions#extended-clients)。此外，与中间件不同，查询扩展组件为您提供端到端类型安全性。[详细了解查询扩展与中间件。](https://www.prisma.io/docs/orm/prisma-client/client-extensions/query#query-extensions-versus-middlewares)

#### 扩展 Prisma 客户端查询操作 ​

使用 `$extends` [客户端级方法](https://www.prisma.io/docs/orm/reference/prisma-client-reference#client-methods)创建[扩展客户端](https://www.prisma.io/docs/orm/prisma-client/client-extensions#about-prisma-client-extensions)。扩展客户端是标准 Prisma 客户端的一种变体，由一个或多个扩展封装。
使用查询扩展组件来修改查询。您可以通过以下方式修改自定义查询：

- [特定模型中的特定操作](https://www.prisma.io/docs/orm/prisma-client/client-extensions/query#modify-a-specific-operation-in-a-specific-model)
- [模式的所有模型中的特定操作](https://www.prisma.io/docs/orm/prisma-client/client-extensions/query#modify-a-specific-operation-in-all-models-of-your-schema)
- [所有 Prisma 客户端操作](https://www.prisma.io/docs/orm/prisma-client/client-extensions/query#modify-all-prisma-client-operations)
- [特定模型中的所有操作](https://www.prisma.io/docs/orm/prisma-client/client-extensions/query#modify-all-operations-in-a-specific-model)
- [架构的所有模型中的所有操作](https://www.prisma.io/docs/orm/prisma-client/client-extensions/query#modify-all-operations-in-all-models-of-your-schema)
- [特定的顶级原始查询操作](https://www.prisma.io/docs/orm/prisma-client/client-extensions/query#modify-a-top-level-raw-query-operation)

要创建自定义查询，请使用以下结构：

```ts
const prisma = new PrismaClient().$extends({
  name?: 'name',
  query?: {
    user: { ... } // in this case, we add a query to the `user` model
  },
});
```

属性如下：

- `name`：（可选）指定错误日志中显示的扩展名。
- `query`：定义自定义查询。

##### 修改特定模型中的特定操作 ​

`query`对象可以包含映射到 Prisma [客户端操作](https://www.prisma.io/docs/orm/reference/prisma-client-reference#model-queries)名称的函数，例如 `findUnique()`、`findFirst`、`findMany`、`count` 和 `create`。
以下示例将 user.findMany 修改为使用自定义查询，仅查找 18 岁以上的用户：

```ts
const prisma = new PrismaClient().$extends({
  query: {
    user: {
      async findMany({ model, operation, args, query }) {
        // take incoming `where` and set `age`
        args.where = { ...args.where, age: { gt: 18 } };

        return query(args);
      },
    },
  },
});

await prisma.user.findMany(); // returns users whose age is greater than 18
```

在上面的示例中，对 `prisma.user.findMany` 的调用会触发 `query.user.findMany`。每个回调都会接收一个描述查询的类型安全的 `{ model, operation, args, query }` 对象。该对象具有以下属性：

- `model`：我们要扩展的查询的包含模型的名称。
  在上面的示例中，模型是“User”类型的字符串。
- `operation`：正在扩展和执行的操作的名称。
  在上面的示例中，操作是“findMany”类型的字符串。
- `args`：要扩展的具体查询输入信息。
  这是一个类型安全的对象，您可以在查询发生之前对其进行更改。您可以改变 `args` 中的任何属性。例外：您不能改变 `include` 或 `select`，因为这会改变预期的输出类型和中断类型安全性。
- `query`：对查询结果的承诺。
  - 您可以使用`await`，然后改变这个 promise 的结果，因为它的值是类型安全的。 TypeScript 捕获对象上的任何不安全突变。

##### 修改架构的所有模型中的特定操作 ​

要扩展架构的所有模型中的查询，请使用 `$allModels` 而不是特定的模型名称。例如：

```ts
const prisma = new PrismaClient().$extends({
  query: {
    $allModels: {
      async findMany({ model, operation, args, query }) {
        // set `take` and fill with the rest of `args`
        args = { ...args, take: 100 };

        return query(args);
      },
    },
  },
});
```

##### 修改特定模型中的所有操作 ​

使用 `$allOperations` 扩展特定模型中的所有操作。
例如，以下代码将自定义查询应用于用户模型上的所有操作：

```ts
const prisma = new PrismaClient().$extends({
  query: {
    user: {
      $allOperations({ model, operation, args, query }) {
        /* your custom logic here */
        return query(args);
      },
    },
  },
});
```

##### 修改所有 Prisma 客户端操作 ​

使用 `$allOperations` 方法修改 Prisma 客户端中存在的所有查询方法。 `$allOperations` 可用于模型操作和原始查询。
您可以按如下方式修改所有方法：

```ts
const prisma = new PrismaClient().$extends({
  query: {
    $allOperations({ model, operation, args, query }) {
      /* your custom logic for modifying all Prisma Client operations here */
      return query(args);
    },
  },
});
```

如果调用[原始查询](https://www.prisma.io/docs/orm/prisma-client/using-raw-sql/raw-queries)，则传递给回调的`model`参数将是`undefined`的。
例如，您可以使用 `$allOperations` 方法来记录查询，如下所示：

```ts
const prisma = new PrismaClient().$extends({
  query: {
    async $allOperations({ operation, model, args, query }) {
      const start = performance.now();
      const result = await query(args);
      const end = performance.now();
      const time = end - start;
      console.log(
        util.inspect(
          { model, operation, args, time },
          { showHidden: false, depth: null, colors: true }
        )
      );
      return result;
    },
  },
});
```

##### 修改架构的所有模型中的所有操作 ​

使用 `$allModels` 和 `$allOperations` 扩展架构的所有模型中的所有操作。
要将自定义查询应用于架构的所有模型上的所有操作：

```ts
const prisma = new PrismaClient().$extends({
  query: {
    $allModels: {
      $allOperations({ model, operation, args, query }) {
        /* your custom logic for modifying all operations on all models here */
        return query(args);
      },
    },
  },
});
```

##### 修改顶级原始查询操作 ​

要将自定义行为应用于特定的顶级原始查询操作，请使用顶级原始查询函数的名称而不是模型名称：
Ralational databases

```ts
const prisma = new PrismaClient().$extends({
  query: {
    $queryRaw({ args, query, operation }) {
      // handle $queryRaw operation
      return query(args);
    },
    $executeRaw({ args, query, operation }) {
      // handle $executeRaw operation
      return query(args);
    },
    $queryRawUnsafe({ args, query, operation }) {
      // handle $queryRawUnsafe operation
      return query(args);
    },
    $executeRawUnsafe({ args, query, operation }) {
      // handle $executeRawUnsafe operation
      return query(args);
    },
  },
});
```

MongoDB

```ts
const prisma = new PrismaClient().$extends({
  query: {
    $runCommandRaw({ args, query, operation }) {
      // handle $runCommandRaw operation
      return query(args);
    },
  },
});
```

##### 改变查询结果 ​

您可以使用`await`，然后改变查询 promise 的结果。

```ts
const prisma = new PrismaClient().$extends({
  query: {
    user: {
      async findFirst({ model, operation, args, query }) {
        const user = await query(args);

        if (user.password !== undefined) {
          user.password = "******";
        }

        return user;
      },
    },
  },
});
```

**INFO:**
_我们包含上面的例子来表明这是可能的。但是，出于性能原因，我们建议您使用结果组件类型来覆盖现有字段。在这种情况下，结果组件类型通常会提供更好的性能，因为它仅在访问时进行计算。查询组件类型在查询执行后计算。_

#### 将查询包装到批量事务中 ​

您可以将扩展查询包装到[批处理事务](https://www.prisma.io/docs/orm/prisma-client/queries/transactions)中。例如，您可以使用它来制定行级安全性 (RLS)。
​ 以下示例扩展了 findFirst ，以便它在批处理事务中运行。

```ts
const prisma = new PrismaClient().$extends({
  query: {
    user: {
      // Get the input `args` and a callback to `query`
      async findFirst({ args, query, operation }) {
        const [result] = await prisma.$transaction([query(args)]); // wrap the query in a batch transaction, and destructure the result to return an array
        return result; // return the first result found in the array
      },
    },
  },
});
```

#### 查询扩展与中间件 ​

您可以使用查询扩展或中间件来挂钩查询生命周期并修改传入查询或其结果。客户端扩展和中间件在以下方面有所不同：

- 中间件总是在全局范围内应用于同一个客户端。客户端扩展是隔离的，除非您有意将它们组合在一起。[了解有关客户端扩展的更多信息。](https://www.prisma.io/docs/orm/prisma-client/client-extensions#about-prisma-client-extensions)
  - 例如，在行级安全性 (RLS) 场景中，您可以将每个用户保留在完全独立的客户端中。使用中间件，所有用户都在同一个客户端中活动。
- 在应用程序执行期间，通过扩展，您可以从一个或多个扩展客户端或标准 Prisma 客户端中进行选择。使用中间件，您无法选择使用哪个客户端，因为只有一个全局客户端。
- 扩展受益于端到端类型安全和推理，但中间件则不然。
  您可以在所有可以使用中间件的场景中使用 Prisma 客户端扩展。

##### 如果使用查询扩展组件和中间件 ​

- 在您的应用程序代码中，您必须在主 Prisma 客户端实例上声明所有中间件。您不能在扩展客户端上声明它们。
- 在执行具有查询组件的中间件和扩展的情况下，Prisma Client 在执行具有查询组件的扩展之前执行中间件。 Prisma 客户端按照您使用 `$use` 或 `$extends` 实例化各个中间件和扩展的顺序执行它们。

### `result`：添加自定义字段和方法来查询结果

您可以使用结果 [Prisma 客户端扩展](https://www.prisma.io/docs/orm/prisma-client/client-extensions)组件类型添加自定义字段和方法来查询结果。
使用 `$extends` [客户端级方法](https://www.prisma.io/docs/orm/reference/prisma-client-reference#client-methods)创建扩展客户端。扩展客户端是标准 Prisma 客户端的一种变体，由一个或多个扩展封装。
要添加自定义字段或方法来查询结果，请使用以下结构。在此示例中，我们将自定义字段 myCompulatedField 添加到用户模型查询的结果中。

```ts
const prisma = new PrismaClient().$extends({
  name?: 'name',
  result?: {
    user: {                   // in this case, we extend the `user` model
      myComputedField: {      // the name of the new computed field
        needs: { ... },
        compute() { ... }
      },
    },
  },
});
```

参数如下：

- `name`：（可选）指定错误日志中显示的扩展名。
- `result`：为查询结果定义新的字段和方法。
- `needs`：描述结果字段依赖关系的对象。
- `compute`：定义访问虚拟字段时如何计算虚拟字段的方法。

您可以使用结果扩展组件向查询结果添加字段。这些字段在运行时计算并且是类型安全的。
在以下示例中，我们向用户模型添加一个名为 fullName 的新虚拟字段。

```ts
const prisma = new PrismaClient().$extends({
  result: {
    user: {
      fullName: {
        // the dependencies
        needs: { firstName: true, lastName: true },
        compute(user) {
          // the computation logic
          return `${user.firstName} ${user.lastName}`;
        },
      },
    },
  },
});

const user = await prisma.user.findFirst();

// return the user's full name, such as "John Doe"
console.log(user.fullName);
```

在上面的例子中，计算的输入用户是根据需求中定义的对象自动键入的。 firstName 和 lastName 是字符串类型，因为它们是在 needs 中指定的。如果未在需求中指定，则无法访问它们。

#### 在另一个计算字段中重复使用一个计算字段 ​

以下示例以类型安全的方式计算用户的头衔和全名。 titleFullName 是一个重用 fullName 计算字段的计算字段。

```ts
const prisma = new PrismaClient()
  .$extends({
    result: {
      user: {
        fullName: {
          needs: { firstName: true, lastName: true },
          compute(user) {
            return `${user.firstName} ${user.lastName}`;
          },
        },
      },
    },
  })
  .$extends({
    result: {
      user: {
        titleFullName: {
          needs: { title: true, fullName: true },
          compute(user) {
            return `${user.title} (${user.fullName})`;
          },
        },
      },
    },
  });
```

##### 字段注意事项 ​

- 出于性能原因，Prisma 客户端在访问时计算结果，而不是在检索时计算结果。
- 您只能创建基于标量字段的计算字段。
- 您只能将计算字段与 select 一起使用，并且不能聚合它们。
  例如：

```ts
const user = await prisma.user.findFirst({
  select: { email: true },
});
console.log(user.fullName); // undefined
```

#### 向结果对象添加自定义方法 ​

您可以使用结果组件添加查询结果的方法。下面的示例添加了一个新方法，保存到结果对象。

```ts
const prisma = new PrismaClient().$extends({
  result: {
    user: {
      save: {
        needs: { id: true },
        compute(user) {
          return () =>
            prisma.user.update({ where: { id: user.id }, data: user });
        },
      },
    },
  },
});

const user = await prisma.user.findUniqueOrThrow({ where: { id: someId } });
user.email = "mynewmail@mailservice.com";
await user.save();
```

#### 使用带有结果扩展组件的`omit`查询选项 ​

您可以将[`omit（预览）`选项](https://www.prisma.io/docs/orm/reference/prisma-client-reference#omit-preview)与[自定义字段](https://www.prisma.io/docs/orm/prisma-client/client-extensions/result#add-a-custom-field-to-query-results)和自定义字段所需的字段一起使用。

##### 从查询结果中省略自定义字段所需的字段 ​

如果省略作为自定义字段的依赖项的字段，则仍会从数据库中读取该字段，即使它不会包含在查询结果中。
以下示例省略了密码字段，该字段是自定义字段 sanitizedPassword 的依赖项：

```ts
const xprisma = prisma.$extends({
  result: {
    user: {
      sanitizedPassword: {
        needs: { password: true },
        compute(user) {
          return sanitize(user.password);
        },
      },
    },
  },
});

const user = await xprisma.user.findFirstOrThrow({
  omit: {
    password: true,
  },
});
```

在这种情况下，尽管结果中省略了密码，但仍会从数据库中查询它，因为它是 sanitizedPassword 自定义字段的依赖项。

##### 从查询结果中省略自定义字段和依赖项 ​

为了确保根本不会从数据库中查询省略的字段，您必须省略自定义字段及其依赖项。
以下示例省略了自定义字段 sanitizedPassword 和相关密码字段：

```ts
const xprisma = prisma.$extends({
  result: {
    user: {
      sanitizedPassword: {
        needs: { password: true },
        compute(user) {
          return sanitize(user.password);
        },
      },
    },
  },
});

const user = await xprisma.user.findFirstOrThrow({
  omit: {
    sanitizedPassword: true,
    password: true,
  },
});
```

在这种情况下，省略密码和 sanitizedPassword 将从结果中排除两者，并防止从数据库读取密码字段。

### 共享 Prisma 客户端扩展

您可以与其他用户共享 [Prisma 客户端扩展](https://www.prisma.io/docs/orm/prisma-client/client-extensions)（作为包或模块），并将其他用户创建的扩展导入到您的项目中。

如果您想构建可共享的扩展，我们还建议使用 [prisma-client-extension-starter](https://github.com/prisma/prisma-client-extension-starter) 模板。

#### 安装共享的打包扩展 ​

在您的项目中，您可以安装其他用户已发布到 npm 的任何 Prisma 客户端扩展。为此，请运行以下命令：
`npm install prisma-extension-<package-name>`

例如，如果可用扩展的包名称是 prisma-extension-find-or-create，您可以按如下方式安装它：
`npm install prisma-extension-find-or-create`

要从上面的示例导入查找或创建扩展，并用它包装您的客户端实例，您可以使用以下代码。此示例假设扩展名是 findOrCreate。

```ts
import findOrCreate from "prisma-extension-find-or-create";

const prisma = new PrismaClient().$extends(findOrCreate);
const user = await prisma.user.findOrCreate();
```

当您调用扩展中的方法时，请使用 `$extends` 语句中的常量名称，而不是 prisma。在上面的示例中，xprisma.user.findOrCreate 有效，但 prisma.user.findOrCreate 无效，因为原始 prisma 没有修改。

##### 创建可共享的扩展 ​

当您想要创建其他用户可以使用的扩展，并且不仅仅针对您的架构定制的扩展时，Prisma ORM 提供了实用程序来允许您创建可共享的扩展。
要创建可共享的扩展： 1.使用 `Prisma.defineExtension` 将扩展定义为模块 2.使用以 `$all` 前缀开头的方法之一，例如 `$allModels` 或 `$allOperations`

###### 定义扩展 ​

使用 `Prisma.defineExtension` 方法使您的扩展可共享。您可以使用它来打包扩展，以便将扩展分离到单独的文件中，或者作为 npm 包与其他用户共享。
`Prisma.defineExtension` 的好处是它为开发中的扩展作者和共享扩展的用户提供严格的类型检查和自动完成。

###### 使用通用方法 ​

包含 `$allModels` 下方法的扩展适用于每个模型，而不是特定模型。类似地， `$allOperations` 下的方法适用于整个客户端实例，而不适用于命名组件，例如结果或查询。
您不需要对客户端组件使用 `$all` 前缀，因为客户端组件始终应用于客户端实例。
例如，通用扩展可能采用以下形式：

```ts
export default Prisma.defineExtension({
  name: "prisma-extension-find-or-create", //Extension name
  model: {
    $allModels: {
      // new method
      findOrCreate(/* args */) {
        /* code for the new method */
        return query(args);
      },
    },
  },
});
```

请参阅以下页面了解修改 Prisma 客户端操作的不同方法：

- [修改所有 Prisma Client 操作](https://www.prisma.io/docs/orm/prisma-client/client-extensions/query#modify-all-prisma-client-operations)
- [修改架构的所有模型中的特定操作](https://www.prisma.io/docs/orm/prisma-client/client-extensions/query#modify-a-specific-operation-in-all-models-of-your-schema)
- [修改架构的所有模型中的所有操作](https://www.prisma.io/docs/orm/prisma-client/client-extensions/query#modify-all-operations-in-all-models-of-your-schema)

###### 将可共享扩展发布到 npm​

然后您可以在 npm 上共享该扩展。当您选择软件包名称时，我们建议您使用 prisma-extension-<package-name> 约定，以便更轻松地查找和安装。

###### 从打包的扩展中调用客户端级方法 ​

**WARNING:**
_目前，引用 PrismaClient 并调用客户端级方法的扩展存在限制，如下例所示。_
_如果您从[事务](https://www.prisma.io/docs/orm/prisma-client/queries/transactions)（交互式或批处理）内部触发扩展，则扩展代码将在新连接中发出查询并忽略当前事务上下文。_
_[在 GitHub 上的本期中了解更多信息：需要使用客户端级方法的客户端扩展以静默方式忽略事务。](https://github.com/prisma/prisma/issues/20678)_

在以下情况下，您需要引用您的扩展包装的 Prisma Client 实例：

- 当您想在打包的扩展中使用[客户端级方法](https://www.prisma.io/docs/orm/reference/prisma-client-reference#client-methods)（例如 `$queryRaw`）时。
- 当您想要在打包的扩展中链接多个 `$extends` 调用时。

但是，当有人在他们的项目中包含您打包的扩展时，您的代码无法知道 Prisma 客户端实例的详细信息。
您可以按如下方式引用该客户端实例：

```ts
Prisma.defineExtension((client) => {
  // The Prisma Client instance that the extension user applies the extension to
  return client.$extends({
    name: "prisma-extension-<extension-name>",
  });
});
```

例如：

```ts
export default Prisma.defineExtension((client) => {
  return client.$extends({
    name: "prisma-extension-find-or-create",
    query: {
      $allModels: {
        async findOrCreate({ args, query, operation }) {
          return (await client.$transaction([query(args)]))[0];
        },
      },
    },
  });
});
```

###### 高级类型安全：用于定义通用扩展的类型实用程序 ​

您可以使用[类型实用程序](https://www.prisma.io/docs/orm/prisma-client/client-extensions/type-utilities)来提高共享扩展的类型安全性。

### 类型实用程序

Prisma Client 中存在多种类型实用程序，可以帮助创建高度类型安全的扩展。

#### 类型实用程序 ​

[Prisma 客户端类型实用程序](https://www.prisma.io/docs/orm/prisma-client/type-safety)是您的应用程序和 Prisma 客户端扩展中可用的实用程序，并提供为您的扩展构建安全和可扩展类型的有用方法。

可用的类型实用程序有：

- `Exact<Input, Shape>`：对输入强制执行严格的类型安全。 `Exact` 确保泛型类型 `Input` 严格符合您在 `Shape` 中指定的类型。它将输入范围缩小到最精确的类型。
- `Args<Type, Operation>`：检索任何给定模型和操作的输入参数。这对于想要执行以下操作的扩展作者特别有用：
  - 重用现有类型来扩展或修改它们。
  - 受益于与现有操作相同的自动完成体验。
- `Result<Type, Arguments, Operation>`：获取输入参数并提供给定模型和操作的结果。您通常会将其与 `Args` 结合使用。与 `Args` 一样，`Result` 可帮助您重用现有类型来扩展或修改它们。
- `Payload<Type, Operation>`：检索结果的整个结构，作为给定模型和操作的标量和关系对象。例如，您可以使用它来确定哪些键是类型级别的标量或对象。
  以下示例基于`findFirst` 创建一个新操作`exists`。它具有 `findFirst` 的所有参数。

```ts
const prisma = new PrismaClient().$extends({
  model: {
    $allModels: {
      // Define a new `exists` operation on all models
      // T is a generic type that corresponds to the current model
      async exists<T>(
        // `this` refers to the current type, e.g. `prisma.user` at runtime
        this: T,

        // The `exists` function will use the `where` arguments from the current model, `T`, and the `findFirst` operation
        where: Prisma.Args<T, "findFirst">["where"]
      ): Promise<boolean> {
        // Retrieve the current model at runtime
        const context = Prisma.getExtensionContext(this);

        // Prisma Client query that retrieves data based
        const result = await (context as any).findFirst({ where });
        return result !== null;
      },
    },
  },
});

async function main() {
  const user = await prisma.user.exists({ name: "Alice" });
  const post = await prisma.post.exists({
    OR: [
      { title: { contains: "Prisma" } },
      { content: { contains: "Prisma" } },
    ],
  });
}
```

#### 向方法添加自定义属性 ​

以下示例说明了如何将自定义参数添加到扩展中的方法：

```ts
type CacheStrategy = {
  swr: number;
  ttl: number;
};

const prisma = new PrismaClient().$extends({
  model: {
    $allModels: {
      findMany<T, A>(
        this: T,
        args: Prisma.Exact<
          A,
          // For the `findMany` method, use the arguments from model `T` and the `findMany` method
          // and intersect it with `CacheStrategy` as part of `findMany` arguments
          Prisma.Args<T, "findMany"> & CacheStrategy
        >
      ): Prisma.Result<T, A, "findMany"> {
        // method implementation with the cache strategy
      },
    },
  },
});

async function main() {
  await prisma.post.findMany({
    cacheStrategy: {
      ttl: 360,
      swr: 60,
    },
  });
}
```

这里的例子只是概念性的。为了使实际的缓存发挥作用，您必须实现逻辑。如果您对缓存扩展/服务感兴趣，我们建议您查看 [Prisma Accelerate](https://www.prisma.io/accelerate)。

### [共享包和示例](https://www.prisma.io/docs/orm/prisma-client/client-extensions/extension-examples)

### 中间件

**WARNING:**
_已弃用：中间件在版本 4.16.0 中已弃用。_
_我们建议使用 Prisma 客户端扩展查询组件类型作为中间件的替代方案。 Prisma 客户端扩展首次在 4.7.0 版本中引入预览版，并在 4.16.0 中全面可用。_
_Prisma 客户端扩展允许您创建独立的 Prisma 客户端实例并将每个客户端绑定到特定的过滤器或用户。例如，您可以将客户端绑定到特定用户以提供用户隔离。 Prisma 客户端扩展还提供端到端类型安全。_
中间件充当查询级生命周期挂钩，允许您在查询运行之前或之后执行操作。使用`prisma.$use`方法添加中间件，如下：

```ts
const prisma = new PrismaClient();

// Middleware 1
prisma.$use(async (params, next) => {
  // Manipulate params here
  const result = await next(params);
  // See results here
  return result;
});

// Middleware 2
prisma.$use(async (params, next) => {
  // Manipulate params here
  const result = await next(params);
  // See results here
  return result;
});

// Queries here
```

**WARNING:**
_使用[批量事务](https://www.prisma.io/docs/orm/prisma-client/queries/transactions#sequential-prisma-client-operations)时，不要在中间件内多次调用 `next` 。这将导致您中断交易并导致意想不到的结果。_

`params` 表示中间件中可用的参数，例如查询的名称，`next` 表示堆栈中的[下一个中间件或原始 Prisma 客户端查询](https://www.prisma.io/docs/orm/prisma-client/client-extensions/middleware#running-order-and-the-middleware-stack)。

中间件的可能用例包括：

- 设置或覆盖字段值 - 例如，[设置博客文章评论的上下文语言](https://www.prisma.io/docs/orm/prisma-client/client-extensions/middleware/session-data-middleware)
- 验证输入数据 - 例如，通过外部服务检查用户输入是否存在不适当的语言
- 拦截删除查询并将其更改为更新以执行[软删除](https://www.prisma.io/docs/orm/prisma-client/client-extensions/middleware/soft-delete-middleware)
- [记录执行查询所花费的时间](https://www.prisma.io/docs/orm/prisma-client/client-extensions/middleware/logging-middleware)
  中间件还有很多用例 - 此列表可以为中间件旨在解决的问题类型提供灵感。

#### 样品 ​

以下示例场景展示了如何在实践中使用中间件:

- [中间件示例：软删除](https://www.prisma.io/docs/orm/prisma-client/client-extensions/middleware/soft-delete-middleware)
- [中间件示例：日志记录](https://www.prisma.io/docs/orm/prisma-client/client-extensions/middleware/logging-middleware)
- [中间件示例：会话数据](https://www.prisma.io/docs/orm/prisma-client/client-extensions/middleware/session-data-middleware)

#### 在哪里添加中间件 ​

在请求处理程序的上下文之外添加 Prisma Client 中间件，否则每个请求都会将中间件的新实例添加到堆栈中。以下示例演示了在 Express 应用程序上下文中添加 Prisma Client 中间件的位置：

```ts
import express from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

prisma.$use(async (params, next) => {
  // Manipulate params here
  const result = await next(params);
  // See results here
  return result;
});

const app = express();
app.get("/feed", async (req, res) => {
  // NO MIDDLEWARE HERE
  const posts = await prisma.post.findMany({
    where: { published: true },
    include: { author: true },
  });
  res.json(posts);
});
```

#### 运行顺序和中间件堆栈 ​

如果您有多个中间件，则每个单独查询的运行顺序为：

1. 每个中间件中`await next(params)`之前的所有逻辑，按降序排列
2. 每个中间件中`await next(params)`之后的所有逻辑，按升序排列

根据您在堆栈中的位置，`await next(params)` 之一：

- 运行下一个中间件（在示例中的中间件 #1 和 #2 中）或
- 运行原始 Prisma 客户端查询（在中间件 #3 中）

```ts
const prisma = new PrismaClient();

// Middleware 1
prisma.$use(async (params, next) => {
  console.log(params.args.data.title);
  console.log("1");
  const result = await next(params);
  console.log("6");
  return result;
});

// Middleware 2
prisma.$use(async (params, next) => {
  console.log("2");
  const result = await next(params);
  console.log("5");
  return result;
});

// Middleware 3
prisma.$use(async (params, next) => {
  console.log("3");
  const result = await next(params);
  console.log("4");
  return result;
});

const create = await prisma.post.create({
  data: {
    title: "Welcome to Prisma Day 2020",
  },
});

const create2 = await prisma.post.create({
  data: {
    title: "How to Prisma!",
  },
});

// Welcome to Prisma Day 2020
// 1
// 2
// 3
// 4
// 5
// 6
// How to Prisma!
// 1
// 2
// 3
// 4
// 5
// 6
```

#### 性能和适当的用例

中间件针对每个查询执行，这意味着过度使用可能会对性能产生负面影响。为了避免增加性能开销：

- 在中间件中尽早检查 `params.model` 和 `params.action` 属性，以避免不必要的运行逻辑：

```ts
prisma.$use(async (params, next) => {
  if (params.model == "Post" && params.action == "delete") {
    // Logic only runs for delete action and Post model
  }
  return next(params);
});
```

``
考虑中间件是否适合您的场景。例如：

- 如果需要填充字段，可以使用`@default`属性吗？
- 如果需要设置 `DateTime` 字段的值，可以使用 `now()` 函数或 `@updatedAt` 属性吗？
- 如果需要执行更复杂的验证，可以在数据库本身中使用 `CHECK` 约束吗？

## type safety

Prisma Client 生成的代码包含几个有用的类型和实用程序，您可以使用它们使您的应用程序更加类型安全。
**NOTE:**
_如果您对 Prisma ORM 的高级类型安全主题感兴趣，请务必查看这篇关于[使用新的 TypeScript satisfies 关键字改进 Prisma Client 工作流程的博客文章](https://www.prisma.io/blog/satisfies-operator-ur8ys8ccq7zb)。_

### 导入生成的类型 ​

您可以导入 Prisma 命名空间并使用点表示法来访问类型和实用程序。
以下示例演示如何导入 Prisma 命名空间并使用它来访问和使用 Prisma.UserSelect 生成的类型：

```ts
import { Prisma } from "@prisma/client";

// Build 'select' object
const userEmail: Prisma.UserSelect = {
  email: true,
};

// Use select object
const createUser = await prisma.user.create({
  data: {
    email: "bob@prisma.io",
  },
  select: userEmail,
});
```

另请参阅：[使用 Prisma.UserCreateInput 生成类型](https://www.prisma.io/docs/orm/prisma-client/queries/crud#create-a-single-record-using-generated-types)

### 什么是生成类型？​

生成的类型是**从模型派生的 TypeScript 类型**。您可以使用它们创建类型化对象，并将其传递到顶级方法（如 `prisma.user.create(...)` 或 `prisma.user.update(...)`）或选项（如 `select` 或 `include`）中。

例如，`select` 接受 `UserSelect` 类型的对象。它的对象属性与根据模型的 `select` 语句支持的对象属性相匹配。

有关可用的不同类型的更多信息，请参阅[模型查询选项参考](https://www.prisma.io/docs/orm/reference/prisma-client-reference#model-query-options)。

#### 生成的 UncheckedInput 类型 ​

`UncheckedInput` 类型是一组特殊的生成类型，允许您执行 Prisma 客户端认为“不安全”的一些操作，例如直接写入[关系标量字段](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations)。在执行`create`、`update`或`upsert`等操作时，您可以选择“安全”输入类型或“不安全”`UncheckedInput` 类型。

#### Type utilities

为了帮助您创建高度类型安全的应用程序，Prisma Client 提供了一组可利用输入和输出类型的类型实用程序。这些类型是完全动态的，这意味着它们适应任何给定的模型和模式。您可以使用它们来改善项目的自动完成和开发人员体验。

这在[验证输入](https://www.prisma.io/docs/orm/prisma-client/type-safety/prisma-validator)和[共享 Prisma 客户端扩展](https://www.prisma.io/docs/orm/prisma-client/client-extensions/shared-extensions)时特别有用。

Prisma 客户端中提供以下类型实用程序：

- `Exact<Input, Shape>`: 对输入强制执行严格的类型安全。 `Exact` 确保泛型类型 `Input` 严格符合您在 `Shape` 中指定的类型。它将输入范围缩小到最精确的类型。
- `Args<Type, Operation>`: 检索任何给定模型和操作的输入参数。这对于想要执行以下操作的扩展作者特别有用：
  - 重用现有类型来扩展或修改它们。
  - 受益于与现有操作相同的自动完成体验。
- `Result<Type, Arguments, Operation>`：获取输入参数并提供给定模型和操作的结果。您通常会将其与 Args 结合使用。与 Args 一样，Result 可帮助您重用现有类型来扩展或修改它们。
- `Payload<Type, Operation>`：检索结果的整个结构，作为给定模型和操作的标量和关系对象。例如，您可以使用它来确定哪些键是类型级别的标量或对象。

举个例子，这里有一个快速方法，可以强制函数的参数与传递给 post.create 的参数相匹配：

```ts
type PostCreateBody = Prisma.Args<typeof prisma.post, "create">["data"];

const addPost = async (postBody: PostCreateBody) => {
  const post = await prisma.post.create({ data: postBody });
  return post;
};

await addPost(myData);
//              ^ guaranteed to match the input of `post.create`
```

### Prisma validator

[Prisma.validator](https://www.prisma.io/docs/orm/reference/prisma-client-reference#prismavalidator) 是一个实用程序函数，它接受生成的类型并返回遵循生成的类型模型字段的类型安全对象。

#### 创建类型化查询语句 ​

让我们假设您创建了一个新的 userEmail 对象，您希望在整个应用程序的不同查询中重复使用该对象。它是键入的并且可以在查询中安全地使用。
下面的示例要求 Prisma 返回 id 为 3 的用户的电子邮件，如果不存在则返回 null。

```ts
import { Prisma } from "@prisma/client";

const userEmail: Prisma.UserSelect = {
  email: true,
};

// Run inside async function
const user = await prisma.user.findUnique({
  where: {
    id: 3,
  },
  select: userEmail,
});
```

这很有效，但以这种方式提取查询语句有一个警告。
您会注意到，如果将鼠标悬停在 userEmail 上，TypeScript 将不会推断对象的键或值（即 email: true）。
如果您在 `prisma.user.findUnique(...)` 查询中对 userEmail 使用点表示法，则同样适用，您将能够访问所选对象可用的所有属性。
如果您在一个文件中使用它可能没问题，但如果您要导出该对象并在其他查询中使用它，或者如果您正在编译一个外部库，您希望在其中控制用户如何在其内部使用该对象查询，那么这将不是类型安全的。
创建对象 userEmail 是为了仅选择用户的电子邮件，但它仍然允许访问所有其他可用属性。它是类型化的，但不是类型安全的。
Prisma 有一种方法来验证生成的类型以确保它们是类型安全的，这是命名空间上可用的实用程序函数，称为验证器。

#### 使用 `Prisma.validator​`

以下示例将 UserSelect 生成的类型传递到 Prisma.validator 实用程序函数中，并以与前面的示例大致相同的方式定义预期返回类型。

```ts
import { Prisma } from "@prisma/client";

const userEmail = Prisma.validator<Prisma.UserSelect>()({
  email: true,
});

// Run inside async function
const user = await prisma.user.findUnique({
  where: {
    id: 3,
  },
  select: userEmail,
});
```

或者，您可以使用以下语法，该语法使用 Prisma Client 的现有实例使用“选择器”模式：

```ts
import { Prisma } from "@prisma/client";
import prisma from "./lib/prisma";

const userEmail = Prisma.validator(
  prisma,
  "user",
  "findUnique",
  "select"
)({
  email: true,
});
```

最大的区别是 userEmail 对象现在是类型安全的。如果将鼠标悬停在其上，TypeScript 会告诉您该对象的键/值对。如果您使用点表示法访问对象的属性，您将只能访问对象的电子邮件属性。
当与用户定义的输入（例如表单数据）结合使用时，此功能非常方便。

#### 将 Prisma.validator 与表单输入相结合 ​

以下示例从 Prisma.validator 创建一个类型安全函数，可在与用户创建的数据（例如表单输入）交互时使用。
**NOTE:**
_表单输入是在运行时确定的，因此无法仅使用 TypeScript 进行验证。在将数据传递到数据库之前，请务必通过其他方式（例如外部验证库）验证表单输入。_

```ts
import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Create a new function and pass the parameters onto the validator
const createUserAndPost = (
  name: string,
  email: string,
  postTitle: string,
  profileBio: string
) => {
  return Prisma.validator<Prisma.UserCreateInput>()({
    name,
    email,
    posts: {
      create: {
        title: postTitle,
      },
    },
    profile: {
      create: {
        bio: profileBio,
      },
    },
  });
};

const findSpecificUser = (email: string) => {
  return Prisma.validator<Prisma.UserWhereInput>()({
    email,
  });
};

// Create the user in the database based on form input
// Run inside async function
await prisma.user.create({
  data: createUserAndPost(
    "Rich",
    "rich@boop.com",
    "Life of Pie",
    "Learning each day"
  ),
});

// Find the specific user based on form input
// Run inside async function
const oneUser = await prisma.user.findUnique({
  where: findSpecificUser("rich@boop.com"),
});
```

`createUserAndPost` 自定义函数是使用 `Prisma.validator` 创建的，并传递生成的类型 `UserCreateInput`。 `Prisma.validator` 验证函数输入，因为分配给参数的类型必须与生成的类型期望的类型匹配。

### Operating against partial structures of your mode types

使用 Prisma 客户端时，Prisma 架构中的每个模型都会转换为专用的 TypeScript 类型。

- 问题：使用生成的模型类型的变体 ​
  **描述：**在某些情况下，您可能需要生成的用户类型的变体。例如，当您有一个函数需要一个带有 posts 关系的 User 模型实例时。或者，当您需要一种类型来仅在应用程序代码中传递用户模型的电子邮件和姓名字段时。
  **解决方案：**
  作为解决方案，您可以使用 Prisma 客户端的帮助程序类型自定义生成的模型类型。
  User 类型仅包含模型的标量字段，但不考虑任何关系。这是因为 Prisma 客户端查询中默认不包含关系。
  但是，有时拥有包含关系的可用类型（即从使用 include 的 API 调用中获取的类型）很有用。同样，另一个有用的场景可能是拥有一个仅包含模型标量字段的子集的可用类型（即从使用 select 的 API 调用中获取的类型）。
  实现此目的的一种方法是在应用程序代码中手动定义这些类型：

```ts
// 1: Define a type that includes the relation to `Post`
type UserWithPosts = {
  id: string;
  email: string;
  name: string | null;
  posts: Post[];
};

// 2: Define a type that only contains a subset of the scalar fields
type UserPersonalData = {
  email: string;
  name: string | null;
};
```

虽然这当然是可行的，但这种方法增加了 Prisma 架构更改时的维护负担，因为您需要手动维护类型。
对此的一个更简洁的解决方案是结合验证器使用 Prisma 命名空间下 Prisma 客户端生成和公开的 UserGetPayload 类型。
以下示例使用 Prisma.validator 创建两个类型安全对象，然后使用 Prisma.UserGetPayload 实用函数创建可用于返回所有用户及其帖子的类型。

```ts
import { Prisma } from "@prisma/client";

// 1: Define a type that includes the relation to `Post`
const userWithPosts = Prisma.validator<Prisma.UserDefaultArgs>()({
  include: { posts: true },
});

// 2: Define a type that only contains a subset of the scalar fields
const userPersonalData = Prisma.validator<Prisma.UserDefaultArgs>()({
  select: { email: true, name: true },
});

// 3: This type will include a user and all their posts
type UserWithPosts = Prisma.UserGetPayload<typeof userWithPosts>;
```

后一种方法的主要好处是：

- 更简洁的方法，因为它利用 Prisma 客户端生成的类型
- 模式更改时减少维护负担并提高类型安全性

- 问题：获取函数的返回类型 ​
  **描述 ​:**
  当对模型进行`select`或`include`操作并从函数返回这些变体时，可能很难访问返回类型，例如：

```ts
// Function definition that returns a partial structure
async function getUsersWithPosts() {
  const users = await prisma.user.findMany({ include: { posts: true } });
  return users;
}
```

从上面的代码片段中提取表示“有帖子的用户”的类型需要一些高级的 TypeScript 用法：

```ts
// Function definition that returns a partial structure
async function getUsersWithPosts() {
  const users = await prisma.user.findMany({ include: { posts: true } });
  return users;
}

// Extract `UsersWithPosts` type with
type ThenArg<T> = T extends PromiseLike<infer U> ? U : T;
type UsersWithPosts = ThenArg<ReturnType<typeof getUsersWithPosts>>;

// run inside `async` function
const usersWithPosts: UsersWithPosts = await getUsersWithPosts();
```

**解决方案 ​:**
使用 Prisma 命名空间公开的 PromiseReturnType，您可以更优雅地解决这个问题：

```ts
import { Prisma } from "@prisma/client";

type UsersWithPosts = Prisma.PromiseReturnType<typeof getUsersWithPosts>;
```

### How to use Prisma ORM's type system

#### Prisma ORM 的类型系统如何工作？​

Prisma ORM 使用类型来定义字段可以保存的数据类型。为了方便入门，Prisma ORM 提供了少量核心标量类型，应涵盖大多数默认用例。例如，采用以下博客文章模型：

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Post {
  id        Int      @id
  title     String
  createdAt DateTime
}
```

Post 模型的 title 字段使用 `String` 标量类型，而 createdAt 字段使用 `DateTime` 标量类型。
数据库也有自己的类型系统，它定义列可以保存的值的类型。大多数数据库提供大量数据类型，以便对列可以存储的内容进行细粒度控制。例如，数据库可能提供对多种大小的整数或 XML 数据的内置支持。这些类型的名称因数据库而异。例如，在 PostgreSQL 中，布尔值的列类型是 `boolean`，而在 MySQL 中，通常使用 `tinyint(1)` 类型。

##### 默认类型映射 ​

为了让您开始使用我们的核心标量类型，Prisma ORM 提供了默认类型映射，将每个标量类型映射到底层数据库中的默认类型。例如：

- 默认情况下，Prisma ORM 的 `String` 类型映射到 PostgreSQL 的 `text` 类型和 MySQL 的 `varchar` 类型
- 默认情况下，Prisma ORM 的 `DateTime` 类型映射到 PostgreSQL 的 `timestamp(3)` 类型和 SQL Server 的 `datetime2` 类型
  请参阅 Prisma ORM 的[数据库连接器页面](https://www.prisma.io/docs/orm/overview/databases)，了解给定数据库的默认类型映射。
  要查看特定给定 Prisma ORM 类型的所有数据库的默认类型映射，请参阅 Prisma 架构参考的[模型字段标量类型部分](https://www.prisma.io/docs/orm/reference/prisma-schema-reference#model-field-scalar-types)。

##### 原生类型映射 ​

有时您可能需要使用更具体的数据库类型，该类型不是 Prisma ORM 类型的默认类型映射之一。为此，Prisma ORM 提供了本机类型属性来细化核心标量类型。例如，在上面的 Post 模型的 createdAt 字段中，您可能希望通过使用日期类型而不是默认类型时间戳 (3) 映射，在基础 PostgreSQL 数据库中使用仅日期列。为此，请将 @db.Date 本机类型属性添加到 createdAt 字段：

```prisma
model Post {
  id        Int      @id
  title     String
  createdAt DateTime @db.Date
}
```

本机类型映射允许您表达数据库中的所有类型。但是，如果 Prisma ORM 默认值满足您的需求，则不需要使用它们。这将为常见用例提供更短、更易读的 Prisma 架构。

#### 如何内省数据库类型 ​
当您内省现有数据库时，Prisma ORM 将获取每个表列的数据库类型，并使用相应模型字段的正确 Prisma ORM 类型在 Prisma 架构中表示它。如果数据库类型不是该 Prisma ORM 标量类型的默认数据库类型，Prisma ORM 还将添加本机类型属性。

#### 将架构更改应用于数据库时如何使用类型 ​
当您使用 `Prisma Migrate` 或 `db Push` 将架构更改应用到数据库时，Prisma ORM 将使用每个字段的 Prisma ORM 标量类型及其必须的任何本机属性来确定数据库中相应列的正确数据库类型。


#### 有关使用 Prisma ORM 类型系统的更多信息 ​
有关使用 Prisma ORM 类型系统的更多参考信息，请参阅以下资源：
- 每个数据库提供程序的[数据库连接器](https://www.prisma.io/docs/orm/overview)页面都有一个类型映射部分，其中包含 Prisma ORM 类型和数据库类型之间的默认类型映射表，以及数据库类型及其在 Prisma ORM 中相应的本机类型属性的表。
- Prisma 架构参考的[模型字段标量类型](https://www.prisma.io/docs/orm/reference/prisma-schema-reference#model-field-scalar-types)部分针对每个 Prisma ORM 标量类型都有一个小节。这包括每个数据库中 Prisma ORM 类型的默认映射表，以及每个数据库的表，列出了 Prisma ORM 中相应的数据库类型及其本机类型属性。


## Testing

### unit testing
单元测试旨在隔离一小部分（单元）代码并测试其逻辑上可预测的行为。它通常涉及模拟对象或服务器响应来模拟现实世界的行为。单元测试的一些好处包括：
- 快速查找并隔离代码中的错误。
- 通过指示某些代码块应该做什么来为每个代码模块提供文档。
- 一个有用的衡量标准，表明重构进展顺利。代码重构后测试仍应通过。
在 Prisma ORM 的上下文中，这通常意味着测试使用 Prisma 客户端进行数据库调用的函数。
单个测试应重点关注函数逻辑如何处理不同的输入（例如空值或空列表）。
这意味着您应该致力于删除尽可能多的依赖项，例如外部服务和数据库，以保持测试及其环境尽可能轻量级。

**NOTE:**
*[这篇博文](https://www.prisma.io/blog/testing-series-2-xPhjjmIEsM)提供了使用 Prisma ORM 在 Express 项目中实施单元测试的全面指南。如果您想深入研究这个主题，请务必阅读它！*


#### 先决条件
本指南假设您的项目中已设置了 JavaScript 测试库 [Jest](https://jestjs.io/) 和 [ts-jest](https://github.com/kulshekhar/ts-jest)。

#### Mocking Prisma Client
为了确保您的单元测试与外部因素隔离，您可以模拟 Prisma Client，这意味着您可以获得能够使用架构（类型安全）的好处，而无需在测试运行时实际调用数据库。
本指南将介绍两种模拟 Prisma 客户端的方法：单例实例和依赖项注入。两者各有优点，具体取决于您的用例。为了帮助模拟 Prisma 客户端，将使用 `jest-mock-extended` 包。

##### 单例​
1. 在项目根目录创建一个名为 client.ts 的文件并添加以下代码。这将实例化一个 Prisma 客户端实例。
```ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
export default prisma
```

2. 接下来在项目根目录创建一个名为 singleton.ts 的文件并添加以下内容：
```ts
import { PrismaClient } from '@prisma/client'
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended'

import prisma from './client'

jest.mock('./client', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}))

beforeEach(() => {
  mockReset(prismaMock)
})

export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>
```
单例文件告诉 Jest 模拟默认导出（./client.ts 中的 Prisma Client 实例），并使用 jest-mock-extended 中的 mockDeep 方法来访问 Prisma Client 上可用的对象和方法。然后，它会在每次测试运行之前重置模拟实例。
接下来，将 setupFilesAfterEnv 属性添加到 jest.config.js 文件中，其中包含 singleton.ts 文件的路径。
```js
module.exports = {
  clearMocks: true,
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/singleton.ts'],
}
```

##### 依赖注入​
1. 创建 context.ts 文件并添加以下内容：
```ts
import { PrismaClient } from '@prisma/client'
import { mockDeep, DeepMockProxy } from 'jest-mock-extended'

export type Context = {
  prisma: PrismaClient
}

export type MockContext = {
  prisma: DeepMockProxy<PrismaClient>
}

export const createMockContext = (): MockContext => {
  return {
    prisma: mockDeep<PrismaClient>(),
  }
}
```
**TIP:**
*如果您发现通过模拟 Prisma 客户端突出显示循环依赖错误，请尝试将 `"strictNullChecks": true` 添加到 tsconfig.json 中。*

2. 要使用上下文，您需要在测试文件中执行以下操作：
```ts
import { MockContext, Context, createMockContext } from '../context'

let mockCtx: MockContext
let ctx: Context

beforeEach(() => {
  mockCtx = createMockContext()
  ctx = mockCtx as unknown as Context
})
```
这将在通过 createMockContext 函数运行每个测试之前创建一个新的上下文。此 (mockCtx) 上下文将用于对 Prisma 客户端进行模拟调用并运行查询进行测试。 ctx 上下文将用于运行测试的场景查询。

#### [单元测试示例​](https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing#example-unit-tests)


### integration testing
集成测试侧重于测试程序的各个部分如何协同工作。在使用数据库的应用程序上下文中，集成测试通常要求数据库可用并且包含便于测试场景的数据。

模拟真实环境的一种方法是使用 Docker 封装数据库和一些测试数据。它可以通过测试进行启动和拆除，从而作为远离生产数据库的隔离环境运行。
**NOTE:**
*[这篇博文](https://www.prisma.io/blog/testing-series-2-xPhjjmIEsM)提供了有关设置集成测试环境和针对真实数据库编写集成测试的全面指南，为那些希望探索该主题的人提供了宝贵的见解。*

#### 先决条件
本指南假设您的计算机上安装了 Docker 和 Docker Compose，并且项目中安装了 Jest。

#### [将 Docker 添加到您的项目中​](https://www.prisma.io/docs/orm/prisma-client/testing/integration-testing#add-docker-to-your-project)

#### 集成测试​
集成测试将在专用测试环境而不是生产或开发环境中针对数据库运行。

##### 操作流程​
1. 启动容器并创建数据库
2. 迁移架构
3. 运行测试
4. 销毁容器
每个测试套件都会在所有测试运行之前为数据库播种。套件中的所有测试完成后，所有表中的数据将被删除并终止连接。

##### [要测试的功能]​(https://www.prisma.io/docs/orm/prisma-client/testing/integration-testing#the-function-to-test)

##### [测试套件​](https://www.prisma.io/docs/orm/prisma-client/testing/integration-testing#the-test-suite)

#### 运行测试​
此设置隔离了现实世界的场景，以便您可以在受控环境中针对真实数据测试应用程序功能。

您可以将一些脚本添加到项目的 package.json 文件中，该文件将设置数据库并运行测试，然后手动销毁容器。

**WARNING:**
*如果测试不适合您，您需要确保测试数据库已正确设置并准备就绪，如[本博客](https://www.prisma.io/blog/testing-series-3-aBUyF8nxAn#make-the-script-wait-until-the-database-server-is-ready)中所述。*
```json
  "scripts": {
    "docker:up": "docker compose up -d",
    "docker:down": "docker compose down",
    "test": "yarn docker:up && yarn prisma migrate deploy && jest -i"
  },
```

测试脚本执行以下操作：
1. 运行 `docker compose up -d `以创建包含 Postgres 映像和数据库的容器。
2. 将 `./prisma/migrations/` 目录中找到的迁移应用到数据库，这会在容器的数据库中创建表。
3. 执行测试。
一旦您满意，您可以运行 `yarn docker:down` 来销毁容器、其数据库和任何测试数据。

## [Deployment](https://www.prisma.io/docs/orm/prisma-client/deployment)

## Observability & logging

## Debugging & troubleshooting

# MIGRATE

## [Getting started](https://www.prisma.io/docs/orm/prisma-migrate/getting-started)

## Understanding Prisma Migrate

### [Overview](https://www.prisma.io/docs/orm/prisma-migrate/understanding-prisma-migrate/overview)

### [Mental model](https://www.prisma.io/docs/orm/prisma-migrate/understanding-prisma-migrate/mental-model)

### [About migration histories](https://www.prisma.io/docs/orm/prisma-migrate/understanding-prisma-migrate/migration-histories)

### [About the shadow database](https://www.prisma.io/docs/orm/prisma-migrate/understanding-prisma-migrate/shadow-database)

### [Limitations and known issues](https://www.prisma.io/docs/orm/prisma-migrate/understanding-prisma-migrate/limitations-and-known-issues)

## Workflows

### [Seeding](https://www.prisma.io/docs/orm/prisma-migrate/workflows/seeding)

### [Prototyping your schema](https://www.prisma.io/docs/orm/prisma-migrate/workflows/prototyping-your-schema)

### [Baselining a database](https://www.prisma.io/docs/orm/prisma-migrate/workflows/baselining)

### [Customizing migrations](https://www.prisma.io/docs/orm/prisma-migrate/workflows/customizing-migrations)

### [Data migrations](https://www.prisma.io/docs/orm/prisma-migrate/workflows/data-migration)

### [Squashing migrations](https://www.prisma.io/docs/orm/prisma-migrate/workflows/squashing-migrations)

### [Generating down migrations](https://www.prisma.io/docs/orm/prisma-migrate/workflows/generating-down-migrations)

### [Patching & hotfixing](https://www.prisma.io/docs/orm/prisma-migrate/workflows/patching-and-hotfixing)

### [Unsupported database features](https://www.prisma.io/docs/orm/prisma-migrate/workflows/unsupported-database-features)

### [Development and production](https://www.prisma.io/docs/orm/prisma-migrate/workflows/development-and-production)

### [Team development](https://www.prisma.io/docs/orm/prisma-migrate/workflows/team-development)

### [Native database types](https://www.prisma.io/docs/orm/prisma-migrate/workflows/native-database-types)

### [Native database functions](https://www.prisma.io/docs/orm/prisma-migrate/workflows/native-database-functions)

### [Troubleshooting](https://www.prisma.io/docs/orm/prisma-migrate/workflows/troubleshooting)

# 工具

## [Prisma CLI](https://www.prisma.io/docs/orm/tools/prisma-cli)

## [Prisma Studio](https://www.prisma.io/docs/orm/tools/prisma-studio)

# 参考

## [Prisma Client API](https://www.prisma.io/docs/orm/reference/prisma-client-reference)

## [Prisma Schema](https://www.prisma.io/docs/orm/reference/prisma-schema-reference)

## [Prisma CLI](https://www.prisma.io/docs/orm/reference/prisma-cli-reference)

## [Errors](https://www.prisma.io/docs/orm/reference/error-reference)

## [Environment variables](https://www.prisma.io/docs/orm/reference/environment-variables-reference)

## [Database features matrix](https://www.prisma.io/docs/orm/reference/database-features)

## [Supported databases](https://www.prisma.io/docs/orm/reference/supported-databases)

## [Connection URLs](https://www.prisma.io/docs/orm/reference/connection-urls)

## [System requirements](https://www.prisma.io/docs/orm/reference/system-requirements)

## Preview features

### [Prisma Client & Prisma schema](https://www.prisma.io/docs/orm/reference/preview-features/client-preview-features)

### [Prisma CLI](https://www.prisma.io/docs/orm/reference/preview-features/cli-preview-features)
