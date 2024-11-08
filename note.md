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
  - 对于关系数据库，num_physical_cpus * 2 + 1
  - [100 for MongoDB](https://www.mongodb.com/zh-cn/docs/manual/reference/connection-string/)
3. 太多连接可能会开始减慢数据库速度并最终导致错误

### 数据库连接

### 自定义模型和字段名

### 配置错误格式

### 读取副本

### database polyfills

## queries

## write your own SQL

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

```

```
