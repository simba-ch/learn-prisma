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

##### 删除所有相关记录​

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

##### 删除特定相关记录​

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

##### 过滤缺少 “-to-many” 关系

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

标量列表（例如，String[]）具有一组特殊的过滤条件 - 例如，以下查询返回标签数组包含数据库的所有帖子：

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
|Scenario|Available techniques|
|--|--|
|Dependent writes|Nested writes|
|Independent writes|<li> `$transaction([])` API </li> <li> Batch operations</li>|
|Read, modify, write|<li>Idempotent operations</li> <li>Optimistic concurrency control</li> <li>Interactive transactions</li>|

您选择的技术取决于您的特定用例。

#### 关于 Prisma 客户端中的交易

Prisma 客户端提供以下使用事务的选项：

- 嵌套写入：使用 Prisma 客户端 API 处理同一事务中一条或多条相关记录的多个操作。
- Batch/bulk 事务：使用 updateMany、deleteMany 和 createMany 批量处理一个或多个操作。
- THE `$transaction` API in Prisma Client：
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

交易 API 有第二个参数。对于交互式事务，您可以在此参数中使用以下可选配置选项：-

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

默认情况下，Prisma 客户端将隔离级别设置为数据库中当前配置的值。

每个数据库默认配置的隔离级别如下：
|Database|Default|
|--|--|
|PostgreSQL|ReadCommitted|
|MySQL|RepeatableRead|
|SQL Server|ReadCommitted|
|CockroachDB|Serializable|
|SQLite|Serializable|

##### 交易时间问题 ​ ​

INFO：

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

###### [何时使用乐观并发控制](https://www.prisma.io/docs/orm/prisma-client/queries/transactions#scenario-reserving-a-seat-at-the-cinema) ​

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

#### 按相关性对结果进行排序

除了 Prisma Client 的默认 orderBy 行为之外，全文搜索还添加了按与给定字符串或字符串的相关性进行排序。
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

### Computed fields

### Excluding fields

### Custom models

### Case sensitivity

### Query optimization

## write your own SQL

### TypedSQL

### Raw queries

### SafeQL & Prisma Client

## fields & types

## extensions

## type safety

## testing

## deployment

## observability & logging

## debugging & troubleshooting

# MIGRATE

# 工具

# 参考

## Prisma Client API

### PrismaClient

### Model queries

### Model query options

### Nested queries

### Filter conditions and operators

### Relation filters

### Scalar list methods

### Scalar list filters

### Composite type methods

### Composite type filters

### Atomic number operations

### Json filters

### Client methods
