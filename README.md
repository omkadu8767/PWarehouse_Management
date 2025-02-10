# Warehouse Management Website

This repository contains a **Warehouse Management Website** built with **Node.js** for the backend and **MySQL** as the database. It provides functionalities such as managing racks, shelves, categories, subcategories, and items. Users can also add and pick items by barcode scanning.

## Features

- **Add Rack**
- **View Rack**
- **Add Category**
- **Add Subcategory**
- **Define Item**
- **Add Item to Warehouse**
- **Add Item by Barcode**
- **Pick Item**
- **Pick Item by Barcode**

---

## Setup Instructions

### Prerequisites

1. **Node.js** (v16 or higher)
2. **MySQL**
3. **npm** (Node Package Manager)

### Backend Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-folder>
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file for environment variables:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=warehouse_management
   ```

4. Start the server:
   ```bash
   npm start
   ```

The server will run on `http://localhost:3000` by default.

### Database Setup

1. Open MySQL and create a database:
   ```sql
   CREATE DATABASE warehouse_management;
   ```

2. Use the following queries to set up the required tables:

   ```sql
   CREATE TABLE `racks` (
     `rack_id` int NOT NULL AUTO_INCREMENT,
     `rack_name` varchar(50) NOT NULL,
     `num_shelves` int NOT NULL,
     `num_bins` int NOT NULL,
     PRIMARY KEY (`rack_id`)
   ) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

   CREATE TABLE `shelves` (
     `shelf_id` varchar(50) NOT NULL,
     `rack_id` int NOT NULL,
     `shelf_number` int NOT NULL,
     PRIMARY KEY (`shelf_id`),
     KEY `rack_id` (`rack_id`),
     CONSTRAINT `shelves_ibfk_1` FOREIGN KEY (`rack_id`) REFERENCES `racks` (`rack_id`)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

   CREATE TABLE `bins` (
     `bin_id` varchar(50) NOT NULL,
     `shelf_id` varchar(50) NOT NULL,
     `rack_id` int NOT NULL,
     `bin_number` int NOT NULL,
     PRIMARY KEY (`bin_id`),
     KEY `shelf_id` (`shelf_id`),
     KEY `rack_id` (`rack_id`),
     CONSTRAINT `bins_ibfk_1` FOREIGN KEY (`shelf_id`) REFERENCES `shelves` (`shelf_id`),
     CONSTRAINT `bins_ibfk_2` FOREIGN KEY (`rack_id`) REFERENCES `racks` (`rack_id`)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

   CREATE TABLE `categories` (
     `category_id` int NOT NULL AUTO_INCREMENT,
     `category_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
     PRIMARY KEY (`category_id`)
   ) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

   CREATE TABLE `subcategories` (
     `subcategory_id` varchar(50) NOT NULL,
     `subcategory_name` varchar(255) NOT NULL,
     `category_id` int NOT NULL,
     PRIMARY KEY (`subcategory_id`),
     KEY `fk_category` (`category_id`),
     CONSTRAINT `fk_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`),
     CONSTRAINT `subcategories_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

   CREATE TABLE `add_item_to_warehouse` (
     `transaction_id` int NOT NULL AUTO_INCREMENT,
     `item_id` int NOT NULL,
     `item_name` varchar(255) NOT NULL,
     `item_add_quantity` int NOT NULL,
     `transaction_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
     PRIMARY KEY (`transaction_id`),
     KEY `item_id` (`item_id`),
     CONSTRAINT `add_item_to_warehouse_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`) ON DELETE CASCADE
   ) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

   CREATE TABLE `pick_up_item_from_warehouse` (
     `transaction_id` int NOT NULL AUTO_INCREMENT,
     `item_id` int NOT NULL,
     `item_name` varchar(255) NOT NULL,
     `item_quantity` int NOT NULL,
     `transaction_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
     PRIMARY KEY (`transaction_id`),
     KEY `item_id` (`item_id`),
     CONSTRAINT `pick_up_item_from_warehouse_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`) ON DELETE CASCADE
   ) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

   CREATE TABLE `add_item_to_warehouse_by_barcode_scanning` (
     `id` int NOT NULL AUTO_INCREMENT,
     `item_name` varchar(255) NOT NULL,
     `item_quantity` int NOT NULL,
     `barcode_value` varchar(255) NOT NULL,
     `transaction_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
     PRIMARY KEY (`id`)
   ) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

   CREATE TABLE `pick_up_item_by_barcode_scanning` (
     `id` int NOT NULL AUTO_INCREMENT,
     `item_name` varchar(255) NOT NULL,
     `item_quantity` int NOT NULL,
     `barcode_value` varchar(255) NOT NULL,
     `transaction_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
     PRIMARY KEY (`id`)
   ) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

   CREATE TABLE `orders` (
     `order_id` varchar(20) NOT NULL,
     `price` decimal(10,2) NOT NULL,
     `item_name` varchar(255) NOT NULL,
     `order_date` date NOT NULL,
     `order_time` time NOT NULL,
     PRIMARY KEY (order_id)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4    COLLATE=utf8mb4_0900_ai_ci;
   ```

   

3. Import these tables into your database management tool (e.g., MySQL Workbench, phpMyAdmin).

---


## Contributors

Feel free to fork the repository and contribute by creating pull requests.

"# PWarehouse_Management" 
