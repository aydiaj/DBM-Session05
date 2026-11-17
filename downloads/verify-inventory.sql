-- Run after setup-inventory.sql in SSMS.
USE [DBM_Session05_Inventory];
GO
SELECT DB_NAME() AS CurrentDatabase;
SELECT COUNT(*) AS TotalItems FROM dbo.Items; -- 16 on fresh setup
SELECT COUNT(*) AS ActiveItems FROM dbo.Items WHERE IsActive = 1; -- 13
SELECT Id, Name, UnitPrice, Stock, IsActive, AddedAt FROM dbo.Items ORDER BY Id;
-- Independent report check: expected Ids 3, 11, in that order.
SELECT Id, Name, UnitPrice, Stock
FROM dbo.Items
WHERE IsActive = 1 AND Stock > 0 AND Name LIKE N'%Star%' AND UnitPrice <= 25
ORDER BY Name;
