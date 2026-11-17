# Session 05 - code explained

Use the codelab for the practical route. This reference explains the supplied scaffold and the completed examples without adding extra required tasks.

## Namespace, package and method

- A NuGet package supplies compiled library code. A using directive imports names from a namespace. A method is an operation you call.
- Microsoft.EntityFrameworkCore.SqlServer is the EF Core SQL Server provider package. Its UseSqlServer extension configures the context for SQL Server.
- Microsoft.Data.SqlClient is the underlying ADO.NET driver. SQL Server is the database engine.
- Creating a context/composing the query does not open a connection in this app. Execution opens it as needed, and it normally closes after the operation.
- The Console project references the database library; that library references the model library. The class libraries compile to DLLs and do not run independently.

## Item.cs

```csharp
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EF10_InventoryModels;

public class Item
{
    public int Id { get; set; }

    [Required]
    [StringLength(100)]
    public string Name { get; set; } = "";

    [Column(TypeName = "decimal(10,2)")]
    public decimal UnitPrice { get; set; }

    public int Stock { get; set; }
    public bool IsActive { get; set; }
    public DateTime AddedAt { get; set; }
}
```

| Line | Code | Meaning |
| --- | --- | --- |
| 1 | `using System.ComponentModel.DataAnnotations;` | Import Required and StringLength. These are model metadata, not automatic EF input validation. |
| 2 | `using System.ComponentModel.DataAnnotations.Schema;` | Import Column so the decimal SQL type can be declared. |
| 4 | `namespace EF10_InventoryModels;` | Group the following classes under this namespace; this does not name a SQL table. |
| 6 | `public class Item` | Declare our entity class. It represents the shape EF uses for mapped inventory data. |
| 7 | `{` | Open or close the surrounding class, method, conditional, loop or error-handling scope. |
| 8 | `public int Id { get; set; }` | Declare a readable/writable integer. EF recognises Id as the key name by convention. |
| 10 | `[Required]` | Name is required in the EF model. |
| 11 | `[StringLength(100)]` | Name has a configured maximum length of 100. |
| 12 | `public string Name { get; set; } = "";` | Declare a readable/writable non-null string and initialise it to empty text. |
| 14 | `[Column(TypeName = "decimal(10,2)")]` | Map UnitPrice to a decimal column with 10 total digits and 2 decimal places. |
| 15 | `public decimal UnitPrice { get; set; }` | Use decimal for a fixed decimal-value property such as a price. |
| 17 | `public int Stock { get; set; }` | Store a whole-number stock quantity. |
| 18 | `public bool IsActive { get; set; }` | Store true/false; the prepared SQL column is bit. |
| 19 | `public DateTime AddedAt { get; set; }` | Store a date and time; the prepared SQL column is datetime2. |
| 20 | `}` | Open or close the surrounding class, method, conditional, loop or error-handling scope. |

## InventoryDBContext.cs

```csharp
using EF10_InventoryModels;
using Microsoft.EntityFrameworkCore;

namespace EF10_InventoryDBLibrary;

public class InventoryDbContext : DbContext
{
    public InventoryDbContext(DbContextOptions<InventoryDbContext> options)
        : base(options)
    {
    }

    public DbSet<Item> Items { get; set; }
}
```

| Line | Code | Meaning |
| --- | --- | --- |
| 1 | `using EF10_InventoryModels;` | Import our entity namespace so Item can be named. |
| 2 | `using Microsoft.EntityFrameworkCore;` | Import EF Core extensions, including UseSqlServer and async query methods. |
| 4 | `namespace EF10_InventoryDBLibrary;` | Group the following classes under this namespace; this does not name a SQL table. |
| 6 | `public class InventoryDbContext : DbContext` | Derive the application context from EF Core DbContext. |
| 7 | `{` | Open or close the surrounding class, method, conditional, loop or error-handling scope. |
| 8 | `public InventoryDbContext(DbContextOptions<InventoryDbContext> options)` | A constructor receives the options for this context. |
| 9 | `: base(options)` | Pass those options to the base DbContext constructor. |
| 10 | `{` | Open or close the surrounding class, method, conditional, loop or error-handling scope. |
| 11 | `}` | Open or close the surrounding class, method, conditional, loop or error-handling scope. |
| 13 | `public DbSet<Item> Items { get; set; }` | Expose the Item entity set. Items supplies the default table name. This is not a list of every table row. |
| 14 | `}` | Open or close the surrounding class, method, conditional, loop or error-handling scope. |

## Program.cs - full reference

```csharp
using EF10_InventoryDBLibrary;
using EF10_InventoryModels;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Data.SqlClient;
using System.Globalization;
using static EF10_InventoryManager.ConsoleReport;

// Supplied: use the same decimal format in each classroom report.
CultureInfo.CurrentCulture = CultureInfo.InvariantCulture;
Console.WriteLine("DBM Session 05 - EF Core recap and LINQ practice");

try
{
    // Supplied configuration loader. Set the server in appsettings.json (TODO 00).
    var configuration = new ConfigurationBuilder()
        .SetBasePath(AppContext.BaseDirectory)
        .AddJsonFile("appsettings.json", optional: false)
        .Build();
    string? connectionString = Environment.GetEnvironmentVariable("DBM_EF05_CONNECTION")
        ?? configuration.GetConnectionString("InventoryDbConnection");
    if (string.IsNullOrWhiteSpace(connectionString) || connectionString.Contains("YOUR_SERVER"))
    {
        Console.WriteLine("Complete TODO 00 in appsettings.json. No database request was made.");
        return;
    }

    // TODO 03 START - Configure the provider, options and context
    var optionsBuilder = new DbContextOptionsBuilder<InventoryDbContext>();
    optionsBuilder.UseSqlServer(connectionString);
    using var db = new InventoryDbContext(optionsBuilder.Options);
    Console.WriteLine("EF Core configured. No query has run yet.");
    // TODO 03 END

    // TODO 04 START - Q0 - Read the alphabetical inventory
    var baselineQuery = db.Items.OrderBy(item => item.Name);
    Console.WriteLine(baselineQuery.ToQueryString());
    List<Item> allItems = await baselineQuery.ToListAsync();
    PrintItems("Q0 - Alphabetical inventory", allItems);
    // TODO 04 END

    // TODO 05 START - Q1 - Active items with stock
    var availableQuery = db.Items
        .Where(item => item.IsActive && item.Stock > 0)
        .OrderBy(item => item.Name);
    List<Item> availableItems = await availableQuery.ToListAsync();
    PrintItems("Q1 - Active and in stock", availableItems);
    // TODO 05 END

    // TODO 06 START - Q2 - Search, including the blank-input policy
    string keyword = "Star";
    keyword = keyword.Trim();
    IQueryable<Item> searchQuery = db.Items;
    if (!string.IsNullOrWhiteSpace(keyword))
    {
        searchQuery = searchQuery.Where(item => item.Name.Contains(keyword));
    }
    List<Item> searchItems = await searchQuery
        .OrderBy(item => item.Name)
        .ToListAsync();
    PrintItems("Q2 - Search", searchItems);
    // TODO 06 END

    // TODO 07 START - Q3 - Stock and price range
    decimal minimumPrice = 10m;
    decimal maximumPrice = 20m;
    var affordableQuery = db.Items
        .Where(item => item.Stock > 0
            && item.UnitPrice >= minimumPrice
            && item.UnitPrice <= maximumPrice)
        .OrderBy(item => item.UnitPrice)
        .ThenBy(item => item.Name);
    List<Item> affordableItems = await affordableQuery.ToListAsync();
    PrintItems("Q3 - Stocked items from 10 to 20", affordableItems);
    // TODO 07 END

    // TODO 08 START - Q4 - Sort and project
    var priceQuery = db.Items
        .OrderByDescending(item => item.UnitPrice)
        .ThenBy(item => item.Name)
        .Select(item => new { item.Name, item.UnitPrice });
    Console.WriteLine(priceQuery.ToQueryString());
    var priceRows = await priceQuery.ToListAsync();
    Console.WriteLine("Q4 - Names and prices");
    foreach (var row in priceRows)
    {
        Console.WriteLine($"{row.Name} | {row.UnitPrice:F2}");
    }
    // TODO 08 END

    // TODO 09 START - Q5 - Count and existence
    int activeCount = await db.Items.CountAsync(item => item.IsActive);
    bool hasActiveZeroStock = await db.Items
        .AnyAsync(item => item.IsActive && item.Stock == 0);
    Console.WriteLine($"Active items: {activeCount}");
    Console.WriteLine($"Any active item with zero stock: {hasActiveZeroStock}");
    // TODO 09 END

    // TODO 10 START - Q6 - Find one item or handle absence
    int selectedId = 3;
    Item? selectedItem = await db.Items
        .FirstOrDefaultAsync(item => item.Id == selectedId);
    if (selectedItem is null)
    {
        Console.WriteLine("Item not found.");
    }
    else
    {
        Console.WriteLine($"Found: {selectedItem.Id} | {selectedItem.Name}");
    }
    // TODO 10 END

    // TODO 11 START - Q7 - Independent report
    string reportKeyword = "Star";
    decimal reportMaximumPrice = 25m;
    var reportQuery = db.Items
        .Where(item => item.IsActive && item.Stock > 0
            && item.Name.Contains(reportKeyword)
            && item.UnitPrice <= reportMaximumPrice)
        .OrderBy(item => item.Name)
        .Select(item => new { item.Id, item.Name, item.UnitPrice, item.Stock });
    Console.WriteLine(reportQuery.ToQueryString());
    var reportRows = await reportQuery.ToListAsync();
    Console.WriteLine("Q7 - Inventory report");
    foreach (var row in reportRows)
    {
        Console.WriteLine($"{row.Id} | {row.Name} | {row.UnitPrice:F2} | {row.Stock}");
    }
    // TODO 11 END
}
catch (SqlException ex)
{
    Console.WriteLine($"SQL Server error {ex.Number}: {ex.Message}");
    Console.WriteLine("Check the instance, authentication and Session 05 setup script in SSMS.");
}
catch (InvalidOperationException ex)
{
    Console.WriteLine($"EF Core model/configuration error: {ex.Message}");
    Console.WriteLine("Check the entity key, Items DbSet, SQL Server provider and options.");
}
catch (ArgumentException ex)
{
    Console.WriteLine($"Connection/options error: {ex.Message}");
}
catch (System.IO.IOException ex)
{
    Console.WriteLine($"Configuration file error: {ex.Message}");
}

```

| Line | Code | Meaning |
| --- | --- | --- |
| 1 | `using EF10_InventoryDBLibrary;` | Import our database-library namespace so the context name is available. |
| 2 | `using EF10_InventoryModels;` | Import our entity namespace so Item can be named. |
| 3 | `using Microsoft.EntityFrameworkCore;` | Import EF Core extensions, including UseSqlServer and async query methods. |
| 4 | `using Microsoft.Extensions.Configuration;` | Import the configuration loader and GetConnectionString extension. |
| 5 | `using Microsoft.Data.SqlClient;` | Import SqlException from the underlying SQL Server driver. |
| 6 | `using System.Globalization;` | Import CultureInfo, used only to keep classroom number output consistent. |
| 7 | `using static EF10_InventoryManager.ConsoleReport;` | Import the supplied class’s static methods so PrintItems can be called by its short name. |
| 9 | `// Supplied: use the same decimal format in each classroom report.` | Comment or TODO marker; C# does not execute this line. |
| 10 | `CultureInfo.CurrentCulture = CultureInfo.InvariantCulture;` | Use a stable decimal point/number format for the sample outputs. |
| 11 | `Console.WriteLine("DBM Session 05 - EF Core recap and LINQ practice");` | Write text to the Console. $ inserts values; :F2 formats a number with two decimal places. This line sends no query. |
| 13 | `try` | Start the scope whose errors are handled by the following catch blocks. |
| 14 | `{` | Open or close the surrounding class, method, conditional, loop or error-handling scope. |
| 15 | `// Supplied configuration loader. Set the server in appsettings.json (TODO 00).` | Comment or TODO marker; C# does not execute this line. |
| 16 | `var configuration = new ConfigurationBuilder()` | Start building application settings in memory. |
| 17 | `.SetBasePath(AppContext.BaseDirectory)` | Look in the running application/output folder. |
| 18 | `.AddJsonFile("appsettings.json", optional: false)` | Load the required JSON file copied by the Console csproj. |
| 19 | `.Build();` | Create the configuration object. |
| 20 | `string? connectionString = Environment.GetEnvironmentVariable("DBM_EF05_CONNECTION")` | Read an optional environment override. ? allows a null string. |
| 21 | `?? configuration.GetConnectionString("InventoryDbConnection");` | If the override is null, use this named connection string from JSON. |
| 22 | `if (string.IsNullOrWhiteSpace(connectionString) &#124;&#124; connectionString.Contains("YOUR_SERVER"))` | Stop for missing settings or an unchanged placeholder. || means either condition is enough. |
| 23 | `{` | Open or close the surrounding class, method, conditional, loop or error-handling scope. |
| 24 | `Console.WriteLine("Complete TODO 00 in appsettings.json. No database request was made.");` | Write text to the Console. $ inserts values; :F2 formats a number with two decimal places. This line sends no query. |
| 25 | `return;` | End the program before any database work. |
| 26 | `}` | Open or close the surrounding class, method, conditional, loop or error-handling scope. |
| 28 | `// TODO 03 START - Configure the provider, options and context` | Comment or TODO marker; C# does not execute this line. |
| 29 | `var optionsBuilder = new DbContextOptionsBuilder<InventoryDbContext>();` | Create the builder for options belonging to our context type. |
| 30 | `optionsBuilder.UseSqlServer(connectionString);` | Select/configure the EF Core SQL Server provider using the destination and authentication settings. This does not open the connection. |
| 31 | `using var db = new InventoryDbContext(optionsBuilder.Options);` | Create a context from built options. Dispose it when the enclosing try scope ends. Construction does not fetch rows. |
| 32 | `Console.WriteLine("EF Core configured. No query has run yet.");` | Write text to the Console. $ inserts values; :F2 formats a number with two decimal places. This line sends no query. |
| 33 | `// TODO 03 END` | Comment or TODO marker; C# does not execute this line. |
| 35 | `// TODO 04 START - Q0 - Read the alphabetical inventory` | Comment or TODO marker; C# does not execute this line. |
| 36 | `var baselineQuery = db.Items.OrderBy(item => item.Name);` | Build primary ordering; this line alone does not fetch rows. |
| 37 | `Console.WriteLine(baselineQuery.ToQueryString());` | Print a debugging SQL preview of this composed query. The preview does not fetch rows. |
| 38 | `List<Item> allItems = await baselineQuery.ToListAsync();` | Execute the composed database query and collect its results. await waits for completion before the next operation. |
| 39 | `PrintItems("Q0 - Alphabetical inventory", allItems);` | Display a loaded Item list with the supplied helper. No new database query is sent. |
| 40 | `// TODO 04 END` | Comment or TODO marker; C# does not execute this line. |
| 42 | `// TODO 05 START - Q1 - Active items with stock` | Comment or TODO marker; C# does not execute this line. |
| 43 | `var availableQuery = db.Items` | Begin describing a query over the Items entity set. |
| 44 | `.Where(item => item.IsActive && item.Stock > 0)` | Add a row condition to the query; the lambda parameter represents each Item. No rows are fetched yet. |
| 45 | `.OrderBy(item => item.Name);` | Build primary ordering; this line alone does not fetch rows. |
| 46 | `List<Item> availableItems = await availableQuery.ToListAsync();` | Execute the composed database query and collect its results. await waits for completion before the next operation. |
| 47 | `PrintItems("Q1 - Active and in stock", availableItems);` | Display a loaded Item list with the supplied helper. No new database query is sent. |
| 48 | `// TODO 05 END` | Comment or TODO marker; C# does not execute this line. |
| 50 | `// TODO 06 START - Q2 - Search, including the blank-input policy` | Comment or TODO marker; C# does not execute this line. |
| 51 | `string keyword = "Star";` | Set a text input for the report. It is a local C# value, not a column name. |
| 52 | `keyword = keyword.Trim();` | Remove surrounding whitespace from the search text. |
| 53 | `IQueryable<Item> searchQuery = db.Items;` | Keep a provider-backed Item query so conditions can be composed before execution. |
| 54 | `if (!string.IsNullOrWhiteSpace(keyword))` | Only add the search filter when the trimmed keyword contains text. ! means not. |
| 55 | `{` | Open or close the surrounding class, method, conditional, loop or error-handling scope. |
| 56 | `searchQuery = searchQuery.Where(item => item.Name.Contains(keyword));` | Add a row condition to the query; the lambda parameter represents each Item. No rows are fetched yet. |
| 57 | `}` | Open or close the surrounding class, method, conditional, loop or error-handling scope. |
| 58 | `List<Item> searchItems = await searchQuery` | Continue the surrounding C# statement. Read this line together with the query or block above. |
| 59 | `.OrderBy(item => item.Name)` | Build primary ordering; this line alone does not fetch rows. |
| 60 | `.ToListAsync();` | Execute the composed database query and collect its results. await waits for completion before the next operation. |
| 61 | `PrintItems("Q2 - Search", searchItems);` | Display a loaded Item list with the supplied helper. No new database query is sent. |
| 62 | `// TODO 06 END` | Comment or TODO marker; C# does not execute this line. |
| 64 | `// TODO 07 START - Q3 - Stock and price range` | Comment or TODO marker; C# does not execute this line. |
| 65 | `decimal minimumPrice = 10m;` | Set a decimal-valued limit. The m suffix makes the number a decimal literal. |
| 66 | `decimal maximumPrice = 20m;` | Set a decimal-valued limit. The m suffix makes the number a decimal literal. |
| 67 | `var affordableQuery = db.Items` | Begin describing a query over the Items entity set. |
| 68 | `.Where(item => item.Stock > 0` | Add a row condition to the query; the lambda parameter represents each Item. No rows are fetched yet. |
| 69 | `&& item.UnitPrice >= minimumPrice` | Continue the predicate: this condition must also be true. |
| 70 | `&& item.UnitPrice <= maximumPrice)` | Continue the predicate: this condition must also be true. |
| 71 | `.OrderBy(item => item.UnitPrice)` | Build primary ordering; this line alone does not fetch rows. |
| 72 | `.ThenBy(item => item.Name);` | Add an ascending tie-breaker to the existing order. |
| 73 | `List<Item> affordableItems = await affordableQuery.ToListAsync();` | Execute the composed database query and collect its results. await waits for completion before the next operation. |
| 74 | `PrintItems("Q3 - Stocked items from 10 to 20", affordableItems);` | Display a loaded Item list with the supplied helper. No new database query is sent. |
| 75 | `// TODO 07 END` | Comment or TODO marker; C# does not execute this line. |
| 77 | `// TODO 08 START - Q4 - Sort and project` | Comment or TODO marker; C# does not execute this line. |
| 78 | `var priceQuery = db.Items` | Begin describing a query over the Items entity set. |
| 79 | `.OrderByDescending(item => item.UnitPrice)` | Build descending primary ordering; this line alone does not fetch rows. |
| 80 | `.ThenBy(item => item.Name)` | Add an ascending tie-breaker to the existing order. |
| 81 | `.Select(item => new { item.Name, item.UnitPrice });` | Build a projection selecting only the named values. new { ... } describes an anonymous result shape. |
| 82 | `Console.WriteLine(priceQuery.ToQueryString());` | Print a debugging SQL preview of this composed query. The preview does not fetch rows. |
| 83 | `var priceRows = await priceQuery.ToListAsync();` | Execute the composed database query and collect its results. await waits for completion before the next operation. |
| 84 | `Console.WriteLine("Q4 - Names and prices");` | Write text to the Console. $ inserts values; :F2 formats a number with two decimal places. This line sends no query. |
| 85 | `foreach (var row in priceRows)` | Read each projected object in the loaded result list; var uses the inferred anonymous type. |
| 86 | `{` | Open or close the surrounding class, method, conditional, loop or error-handling scope. |
| 87 | `Console.WriteLine($"{row.Name} &#124; {row.UnitPrice:F2}");` | Write text to the Console. $ inserts values; :F2 formats a number with two decimal places. This line sends no query. |
| 88 | `}` | Open or close the surrounding class, method, conditional, loop or error-handling scope. |
| 89 | `// TODO 08 END` | Comment or TODO marker; C# does not execute this line. |
| 91 | `// TODO 09 START - Q5 - Count and existence` | Comment or TODO marker; C# does not execute this line. |
| 92 | `int activeCount = await db.Items.CountAsync(item => item.IsActive);` | Execute a count in the database and await the integer result. |
| 93 | `bool hasActiveZeroStock = await db.Items` | Continue the surrounding C# statement. Read this line together with the query or block above. |
| 94 | `.AnyAsync(item => item.IsActive && item.Stock == 0);` | Execute an existence test and return a Boolean. |
| 95 | `Console.WriteLine($"Active items: {activeCount}");` | Write text to the Console. $ inserts values; :F2 formats a number with two decimal places. This line sends no query. |
| 96 | `Console.WriteLine($"Any active item with zero stock: {hasActiveZeroStock}");` | Write text to the Console. $ inserts values; :F2 formats a number with two decimal places. This line sends no query. |
| 97 | `// TODO 09 END` | Comment or TODO marker; C# does not execute this line. |
| 99 | `// TODO 10 START - Q6 - Find one item or handle absence` | Comment or TODO marker; C# does not execute this line. |
| 100 | `int selectedId = 3;` | Set the primary-key value to find. Try 3 and 999. |
| 101 | `Item? selectedItem = await db.Items` | Declare a possibly missing Item returned by the following lookup. |
| 102 | `.FirstOrDefaultAsync(item => item.Id == selectedId);` | Execute a single-result lookup; Item is null when no row matches. |
| 103 | `if (selectedItem is null)` | Handle the no-match result before reading entity properties. |
| 104 | `{` | Open or close the surrounding class, method, conditional, loop or error-handling scope. |
| 105 | `Console.WriteLine("Item not found.");` | Write text to the Console. $ inserts values; :F2 formats a number with two decimal places. This line sends no query. |
| 106 | `}` | Open or close the surrounding class, method, conditional, loop or error-handling scope. |
| 107 | `else` | Use this branch when the preceding if condition is false. |
| 108 | `{` | Open or close the surrounding class, method, conditional, loop or error-handling scope. |
| 109 | `Console.WriteLine($"Found: {selectedItem.Id} &#124; {selectedItem.Name}");` | Write text to the Console. $ inserts values; :F2 formats a number with two decimal places. This line sends no query. |
| 110 | `}` | Open or close the surrounding class, method, conditional, loop or error-handling scope. |
| 111 | `// TODO 10 END` | Comment or TODO marker; C# does not execute this line. |
| 113 | `// TODO 11 START - Q7 - Independent report` | Comment or TODO marker; C# does not execute this line. |
| 114 | `string reportKeyword = "Star";` | Set a text input for the report. It is a local C# value, not a column name. |
| 115 | `decimal reportMaximumPrice = 25m;` | Set a decimal-valued limit. The m suffix makes the number a decimal literal. |
| 116 | `var reportQuery = db.Items` | Begin describing a query over the Items entity set. |
| 117 | `.Where(item => item.IsActive && item.Stock > 0` | Add a row condition to the query; the lambda parameter represents each Item. No rows are fetched yet. |
| 118 | `&& item.Name.Contains(reportKeyword)` | Continue the predicate: this condition must also be true. |
| 119 | `&& item.UnitPrice <= reportMaximumPrice)` | Continue the predicate: this condition must also be true. |
| 120 | `.OrderBy(item => item.Name)` | Build primary ordering; this line alone does not fetch rows. |
| 121 | `.Select(item => new { item.Id, item.Name, item.UnitPrice, item.Stock });` | Build a projection selecting only the named values. new { ... } describes an anonymous result shape. |
| 122 | `Console.WriteLine(reportQuery.ToQueryString());` | Print a debugging SQL preview of this composed query. The preview does not fetch rows. |
| 123 | `var reportRows = await reportQuery.ToListAsync();` | Execute the composed database query and collect its results. await waits for completion before the next operation. |
| 124 | `Console.WriteLine("Q7 - Inventory report");` | Write text to the Console. $ inserts values; :F2 formats a number with two decimal places. This line sends no query. |
| 125 | `foreach (var row in reportRows)` | Read each projected object in the loaded result list; var uses the inferred anonymous type. |
| 126 | `{` | Open or close the surrounding class, method, conditional, loop or error-handling scope. |
| 127 | `Console.WriteLine($"{row.Id} &#124; {row.Name} &#124; {row.UnitPrice:F2} &#124; {row.Stock}");` | Write text to the Console. $ inserts values; :F2 formats a number with two decimal places. This line sends no query. |
| 128 | `}` | Open or close the surrounding class, method, conditional, loop or error-handling scope. |
| 129 | `// TODO 11 END` | Comment or TODO marker; C# does not execute this line. |
| 130 | `}` | Open or close the surrounding class, method, conditional, loop or error-handling scope. |
| 131 | `catch (SqlException ex)` | Handle SQL Server/driver errors. ex exposes the exception details. |
| 132 | `{` | Open or close the surrounding class, method, conditional, loop or error-handling scope. |
| 133 | `Console.WriteLine($"SQL Server error {ex.Number}: {ex.Message}");` | Write text to the Console. $ inserts values; :F2 formats a number with two decimal places. This line sends no query. |
| 134 | `Console.WriteLine("Check the instance, authentication and Session 05 setup script in SSMS.");` | Write text to the Console. $ inserts values; :F2 formats a number with two decimal places. This line sends no query. |
| 135 | `}` | Open or close the surrounding class, method, conditional, loop or error-handling scope. |
| 136 | `catch (InvalidOperationException ex)` | Handle EF model/configuration or query-operation errors. |
| 137 | `{` | Open or close the surrounding class, method, conditional, loop or error-handling scope. |
| 138 | `Console.WriteLine($"EF Core model/configuration error: {ex.Message}");` | Write text to the Console. $ inserts values; :F2 formats a number with two decimal places. This line sends no query. |
| 139 | `Console.WriteLine("Check the entity key, Items DbSet, SQL Server provider and options.");` | Write text to the Console. $ inserts values; :F2 formats a number with two decimal places. This line sends no query. |
| 140 | `}` | Open or close the surrounding class, method, conditional, loop or error-handling scope. |
| 141 | `catch (ArgumentException ex)` | Handle invalid option/connection arguments. |
| 142 | `{` | Open or close the surrounding class, method, conditional, loop or error-handling scope. |
| 143 | `Console.WriteLine($"Connection/options error: {ex.Message}");` | Write text to the Console. $ inserts values; :F2 formats a number with two decimal places. This line sends no query. |
| 144 | `}` | Open or close the surrounding class, method, conditional, loop or error-handling scope. |
| 145 | `catch (System.IO.IOException ex)` | Handle configuration file I/O failures. |
| 146 | `{` | Open or close the surrounding class, method, conditional, loop or error-handling scope. |
| 147 | `Console.WriteLine($"Configuration file error: {ex.Message}");` | Write text to the Console. $ inserts values; :F2 formats a number with two decimal places. This line sends no query. |
| 148 | `}` | Open or close the surrounding class, method, conditional, loop or error-handling scope. |

## ConsoleReport.cs - supplied display helper

```csharp
using EF10_InventoryModels;

namespace EF10_InventoryManager;

// Supplied display helper. It reads the loaded list; it does not query SQL Server.
internal static class ConsoleReport
{
    internal static void PrintItems(string title, List<Item> items)
    {
        Console.WriteLine($"\n{title}");
        Console.WriteLine("Id | Name | UnitPrice | Stock | IsActive");
        foreach (Item item in items)
        {
            Console.WriteLine($"{item.Id} | {item.Name} | {item.UnitPrice:F2} | {item.Stock} | {item.IsActive}");
        }
        Console.WriteLine($"Rows: {items.Count}");
        if (items.Count == 0)
            Console.WriteLine("No items matched.");
    }
}

```

| Line | Code | Meaning |
| --- | --- | --- |
| 1 | `using EF10_InventoryModels;` | Import our entity namespace so Item can be named. |
| 3 | `namespace EF10_InventoryManager;` | Group the following classes under this namespace; this does not name a SQL table. |
| 5 | `// Supplied display helper. It reads the loaded list; it does not query SQL Server.` | Comment or TODO marker; C# does not execute this line. |
| 6 | `internal static class ConsoleReport` | Group the supplied display method in a class usable within this Console project; static means no helper object is needed. |
| 7 | `{` | Open or close the surrounding class, method, conditional, loop or error-handling scope. |
| 8 | `internal static void PrintItems(string title, List<Item> items)` | The supplied method receives a heading and a loaded list, prints them and returns no result. |
| 9 | `{` | Open or close the surrounding class, method, conditional, loop or error-handling scope. |
| 10 | `Console.WriteLine($"\n{title}");` | Write text to the Console. $ inserts values; :F2 formats a number with two decimal places. This line sends no query. |
| 11 | `Console.WriteLine("Id &#124; Name &#124; UnitPrice &#124; Stock &#124; IsActive");` | Write text to the Console. $ inserts values; :F2 formats a number with two decimal places. This line sends no query. |
| 12 | `foreach (Item item in items)` | Loop through already loaded Item objects. This helper sends no SQL. |
| 13 | `{` | Open or close the surrounding class, method, conditional, loop or error-handling scope. |
| 14 | `Console.WriteLine($"{item.Id} &#124; {item.Name} &#124; {item.UnitPrice:F2} &#124; {item.Stock} &#124; {item.IsActive}");` | Write text to the Console. $ inserts values; :F2 formats a number with two decimal places. This line sends no query. |
| 15 | `}` | Open or close the surrounding class, method, conditional, loop or error-handling scope. |
| 16 | `Console.WriteLine($"Rows: {items.Count}");` | Print the local list count. $ enables interpolation inside braces. |
| 17 | `if (items.Count == 0)` | Check whether the loaded list is empty. |
| 18 | `Console.WriteLine("No items matched.");` | Write text to the Console. $ inserts values; :F2 formats a number with two decimal places. This line sends no query. |
| 19 | `}` | Open or close the surrounding class, method, conditional, loop or error-handling scope. |
| 20 | `}` | Open or close the surrounding class, method, conditional, loop or error-handling scope. |

## Project and settings files

- Directory.Build.props sets net10.0, implicit usings and nullable reference checks for all three projects.
- OutputType=Exe makes InventoryManager the runnable Console app. ProjectReference links the libraries.
- PackageReference restores a named NuGet dependency. appsettings.json is copied to output by CopyToOutputDirectory.
- ConnectionStrings is the JSON section; InventoryDbConnection is the key read by GetConnectionString.
- JSON writes a literal backslash with two backslashes. Integrated Security uses Windows authentication.
- The DBM_EF05_CONNECTION environment variable overrides JSON when supplied. Do not submit passwords.

## SQL setup

- USE selects a database; GO separates SSMS batches.
- DB_ID checks whether the named database exists. The CREATE DATABASE statement runs only when needed.
- OBJECT_ID checks whether dbo.Items exists before CREATE TABLE. Id is its primary key.
- The table defines decimal precision, nullability and nonnegative stock/price checks.
- COL_LENGTH guards against a different pre-existing schema. THROW stops with an explanatory error.
- Seed rows are inserted only when the table is empty. A second run keeps existing data.
- CONVERT(datetime2, ISO-text, 126) parses the supplied unambiguous timestamps. No database or row is dropped.

## Official documentation

- SQL Server provider: https://learn.microsoft.com/en-us/ef/core/providers/sql-server/
- Context/options: https://learn.microsoft.com/en-us/ef/core/dbcontext-configuration/
- Entity/table conventions: https://learn.microsoft.com/en-us/ef/core/modeling/entity-types
- Property mapping: https://learn.microsoft.com/en-us/ef/core/modeling/entity-properties
- Queries: https://learn.microsoft.com/en-us/ef/core/querying/
- Async: https://learn.microsoft.com/en-us/ef/core/miscellaneous/async
- SQL debugging: https://learn.microsoft.com/en-us/dotnet/api/microsoft.entityframeworkcore.entityframeworkqueryableextensions.toquerystring

The Inventory organisation follows the supplied Session 04 starter/book activity pattern. Added fields and query requests are classroom adaptations, not quoted book examples.
