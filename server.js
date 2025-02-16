const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Pass@123',
    database: 'warehouse_management'
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Utility Function: Handle Errors
const handleError = (err, res, message = 'An error occurred') => {
    console.error(message, err);
    res.status(500).send(message);
};

// Add Rack (Feature 1)
app.post('/addRack', (req, res) => {
    const { rack_name, num_shelves, num_bins } = req.body;

    if (!rack_name || !num_shelves || !num_bins) {
        return res.status(400).send('All fields are required');
    }

    const sqlRack = 'INSERT INTO racks (rack_name, num_shelves, num_bins) VALUES (?, ?, ?)';
    db.query(sqlRack, [rack_name, num_shelves, num_bins], (err, result) => {
        if (err) return handleError(err, res, 'Error adding rack');

        const rack_id = result.insertId;

        // Generate shelves and bins
        const shelves = [];
        const bins = [];
        for (let i = 1; i <= num_shelves; i++) {
            const shelf_id = `${rack_id}-${i}`;
            shelves.push([shelf_id, rack_id, i]);

            for (let j = 1; j <= num_bins; j++) {
                const bin_id = `${shelf_id}-${j}`;
                bins.push([bin_id, shelf_id, rack_id, j]);
            }
        }

        const sqlShelves = 'INSERT INTO shelves (shelf_id, rack_id, shelf_number) VALUES ?';
        db.query(sqlShelves, [shelves], (err) => {
            if (err) return handleError(err, res, 'Error adding shelves');

            const sqlBins = 'INSERT INTO bins (bin_id, shelf_id, rack_id, bin_number) VALUES ?';
            db.query(sqlBins, [bins], (err) => {
                if (err) return handleError(err, res, 'Error adding bins');
                res.send('Rack added successfully');
            });
        });
    });
});

// View Racks (Feature 2)
app.get('/viewRacks', (req, res) => {
    const sql = 'SELECT * FROM racks';
    db.query(sql, (err, results) => {
        if (err) return handleError(err, res, 'Error fetching racks');
        res.json(results);
    });
});

// Add Category (Feature 4)
app.post('/addCategory', (req, res) => {
    const { category_name } = req.body;

    if (!category_name) {
        return res.status(400).send('Category name is required');
    }

    const sql = 'INSERT INTO categories (category_name) VALUES (?)';
    db.query(sql, [category_name], (err) => {
        if (err) {
            console.error(err); // Log the error for debugging
            return res.status(500).send('Error adding category'); // Send error response
        }
        res.send('Category added successfully'); // Send success response
    });
});

// Handle adding a subcategory
app.post('/addSubcategory', (req, res) => {
    const { subcategory_name, category_id } = req.body;

    console.log('Received:', { subcategory_name, category_id }); // Log received data

    if (!subcategory_name || !category_id) {
        return res.status(400).send('All fields are required');
    }

    // Check if the category exists
    const checkCategorySql = 'SELECT * FROM categories WHERE category_id = ?';
    db.query(checkCategorySql, [category_id], (err, results) => {
        if (err) return handleError(err, res, 'Error checking category');

        if (results.length === 0) {
            return res.status(400).send('Category does not exist. Please add the category first.');
        }

        // Check for duplicate subcategory name
        const checkDuplicateSql = 'SELECT * FROM subcategories WHERE subcategory_name = ? AND category_id = ?';
        db.query(checkDuplicateSql, [subcategory_name, category_id], (err, duplicateResults) => {
            if (err) return handleError(err, res, 'Error checking for duplicates');

            if (duplicateResults.length > 0) {
                return res.status(400).send('Subcategory name already exists under this category.');
            }

            // Create subcategory ID based on your requirements
            const subcategory_id = `${category_id}-${Date.now().toString().slice(-4)}`;
            const sql = 'INSERT INTO subcategories (subcategory_id, subcategory_name, category_id) VALUES (?, ?, ?)';

            db.query(sql, [subcategory_id, subcategory_name, category_id], (err) => {
                if (err) {
                    console.error(err); // Log any SQL errors
                    return res.status(500).send('Error adding subcategory');
                }
                res.send('Subcategory added successfully');
            });
        });
    });
});



// Handle retrieving categories for the UI
app.get('/categories', (req, res) => {
    const sql = 'SELECT * FROM categories';
    db.query(sql, (err, results) => {
        if (err) return handleError(err, res, 'Error fetching categories');

        res.json(results); // Send categories as JSON
    });
});

// Add Item (Feature 6)
app.post('/addItem', (req, res) => {
    const { item_name, category_id, subcategory_id, quantity, quantity_unit, barcode_value } = req.body;

    if (!item_name || !category_id || !subcategory_id || !quantity || !quantity_unit || !barcode_value) {
        return res.status(400).send('All fields are required');
    }

    console.log('Checking subcategory:', subcategory_id);

    const checkSubcategorySql = 'SELECT * FROM subcategories WHERE subcategory_id = ?';
    db.query(checkSubcategorySql, [subcategory_id], (err, results) => {
        if (err) {
            console.error('Error checking subcategory:', err);
            return res.status(500).send('Error checking subcategory');
        }

        if (results.length === 0) {
            return res.status(400).send('Subcategory does not exist. Please add the subcategory first.');
        }

        console.log('Subcategory exists:', results);

        // Remove bin_id from here since it doesn't exist in your items table
        const sql = 'INSERT INTO items (item_name, category_id, subcategory_id, quantity, quantity_unit, barcode_value) VALUES (?, ?, ?, ?, ?, ?)';
        db.query(sql, [item_name, category_id, subcategory_id, quantity, quantity_unit, barcode_value], (err) => {
            if (err) {
                console.error('Error adding item:', err);
                return res.status(500).send('Error adding item');
            }
            res.send('Item added successfully');
        });
    });
});
app.get('/subcategories', (req, res) => {
    const categoryId = req.query.category_id;

    const sql = 'SELECT * FROM subcategories WHERE category_id = ?';
    db.query(sql, [categoryId], (err, results) => {
        if (err) return handleError(err, res, 'Error fetching subcategories');

        res.json(results); // Send subcategories as JSON
    });
});



// Transactions (Feature 7, 9, 10)
// app.post('/addTransaction', (req, res) => {
//     const { item_id, transaction_type, quantity } = req.body;

//     if (!item_id || !transaction_type || !quantity) {
//         return res.status(400).send('All fields are required');
//     }

//     const sqlTransaction = 'INSERT INTO transactions (item_id, transaction_type, quantity) VALUES (?, ?, ?)';
//     db.query(sqlTransaction, [item_id, transaction_type, quantity], (err) => {
//         if (err) return handleError(err, res, 'Error adding transaction');

//         const updateSql =
//             transaction_type === 'ADD'
//                 ? 'UPDATE items SET quantity = quantity + ? WHERE item_id = ?'
//                 : 'UPDATE items SET quantity = quantity - ? WHERE item_id = ?';

//         db.query(updateSql, [quantity, item_id], (err) => {
//             if (err) return handleError(err, res, 'Error updating item quantity');
//             res.send('Transaction processed successfully');
//         });
//     });
// });
// Endpoint to fetch available bins
app.get('/availableBins', (req, res) => {
    const sql = 'SELECT bin_id, shelf_id, rack_id, bin_number, status FROM bins WHERE status = "Unused"'; // Or any other criteria for "available"
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching available bins:', err);
            return res.status(500).json({ message: 'Error fetching available bins' });
        }
        res.json(results);
    });
});

// Endpoint to add items to the warehouse
app.post('/addItemToWarehouse', (req, res) => {
    const { item_id, item_add_quantity, item_name, bin_id } = req.body;

    if (!item_id || !item_add_quantity || !item_name) {
        return res.status(400).send('All fields are required');
    }

    // 1. Find an available bin (or reuse existing)
    const findAvailableBin = (itemId, callback) => {
        // Check if a bin is already assigned to this item
        const checkExistingSql = 'SELECT bin_id FROM item_bin_assignment WHERE item_id = ?';
        db.query(checkExistingSql, [itemId], (err, existingBins) => {
            if (err) {
                console.error('Error checking existing bin:', err);
                return callback(err, null);
            }

            if (existingBins.length > 0) {
                // Use existing bin
                const existingBinId = existingBins[0].bin_id;
                console.log(`Reusing existing bin ${existingBinId} for item ${itemId}`);
                return callback(null, existingBinId);
            }

            // Find an unused bin
            const findUnusedSql = 'SELECT bin_id FROM bins WHERE status = "Unused" LIMIT 1';
            db.query(findUnusedSql, (err, unusedBins) => {
                if (err) {
                    console.error('Error finding unused bin:', err);
                    return callback(err, null);
                }

                if (unusedBins.length > 0) {
                    const unusedBinId = unusedBins[0].bin_id;
                    console.log(`Found unused bin ${unusedBinId} for item ${itemId}`);
                    callback(null, unusedBinId);
                } else {
                    console.log('No available bins!');
                    callback(new Error('No available bins'), null);
                }
            });
        });
    };
    // 2. Use the bin ID in the insertion
    findAvailableBin(item_id, (err, binId) => {
        if (err) {
            console.error('Error finding available bin:', err);
            return res.status(500).send('Error finding available bin');
        }

        if (!binId) {
            console.log('No bin found, cannot add item to warehouse.');
            return res.status(500).send('No available bins for this item');
        }

        //3. Start the transaction
        db.beginTransaction((transactionErr) => {
            if (transactionErr) {
                console.error('Transaction begin error:', transactionErr);
                return res.status(500).send('Transaction begin error');
            }

            //4. Insert the item into the add_item_to_warehouse table
            const sql = `
                INSERT INTO add_item_to_warehouse (item_id, item_name, item_add_quantity, bin_id)
                VALUES (?, ?, ?, ?)
            `;

            db.query(sql, [item_id, item_name, item_add_quantity, binId], (sqlErr, result) => {
                if (sqlErr) {
                    return db.rollback(() => {
                        console.error('SQL insert error:', sqlErr);
                        return res.status(500).send('SQL insert error');
                    });
                }


                //5. Update the item quantity in the items table
                const updateSql = 'UPDATE items SET quantity = quantity + ? WHERE item_id = ?';

                db.query(updateSql, [item_add_quantity, item_id], (updateErr) => {
                    if (updateErr) {
                        return db.rollback(() => {
                            console.error('SQL update error:', updateErr);
                            return res.status(500).send('SQL update error');
                        });
                    }

                    //6. Update or Insert item into the available_items table
                    const availableUpdateSql = `
                        INSERT INTO available_items (item_id, item_name, added_quantity, picked_quantity, bin_id)
                        VALUES (?, ?, ?, 0, ?)
                        ON DUPLICATE KEY UPDATE added_quantity = added_quantity + VALUES(added_quantity)
                    `;

                    db.query(availableUpdateSql, [item_id, item_name, item_add_quantity, binId], (availableErr) => {
                        if (availableErr) {
                            return db.rollback(() => {
                                console.error('SQL available update error:', availableErr);
                                return res.status(500).send('SQL available update error');
                            });
                        }
                        //7. Update the bin status
                        const updateBinSql = 'UPDATE bins SET status = "Used" WHERE bin_id = ?';
                        db.query(updateBinSql, [bin_id], (binErr) => {
                            if (binErr) {
                                return db.rollback(() => {
                                    console.error('SQL bin update error:', binErr);
                                    return res.status(500).send('SQL bin update error');
                                });
                            }

                            //8. Assign bin to item in item_bin_assignment table
                            const assignBinSql = `
                                INSERT INTO item_bin_assignment (item_id, bin_id)
                                VALUES (?, ?)`;
                            db.query(assignBinSql, [item_id, bin_id], (assignErr) => {
                                if (assignErr) {
                                    return db.rollback(() => {
                                        console.error('SQL assign bin error:', assignErr);
                                        return res.status(500).send('SQL assign bin error');
                                    });
                                }

                                //9. Commit transaction
                                db.commit((commitErr) => {
                                    if (commitErr) {
                                        return db.rollback(() => {
                                            console.error('SQL commit error:', commitErr);
                                            return res.status(500).send('SQL commit error');
                                        });
                                    }

                                    console.log(`Item ${item_id} added to warehouse successfully with bin ${binId}`);
                                    res.send('Item added to warehouse successfully');
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});




// Endpoint to fetch all items
app.get('/items', (req, res) => {
    const sql = 'SELECT * FROM items'; // Adjust this query as necessary based on your database structure
    db.query(sql, (err, results) => {
        if (err) return handleError(err, res, 'Error fetching items');

        res.json(results); // Send items as JSON response
    });
});

// Endpoint to pick items to the warehouse
app.post('/pickUpItem', (req, res) => {
    const { item_id, item_pick_quantity, item_name } = req.body;

    if (!item_id || !item_pick_quantity || !item_name) {
        return res.status(400).send('All fields are required');
    }

    const sql = `
        INSERT INTO pick_up_item_from_warehouse (item_id, item_name, item_quantity)
        VALUES (?, ?, ?)
    `;

    db.query(sql, [item_id, item_name, item_pick_quantity], (err) => { // Corrected variable name here
        if (err) {
            console.error('Error picking up item from warehouse:', err);
            return res.status(500).send('Error picking up item from warehouse');
        }

        // Update quantity in main items table
        const updateSql = 'UPDATE items SET quantity = quantity - ? WHERE item_id = ?'; // Changed to decrement

        db.query(updateSql, [item_pick_quantity, item_id], (err) => {
            if (err) {
                console.error('Error updating item quantity:', err);
                return res.status(500).send('Error updating item quantity');
            }

            // Update available_items table
            const availableUpdateSql = `
                UPDATE available_items 
                SET picked_quantity = picked_quantity + ?
                WHERE item_id = ?
            `;
            db.query(availableUpdateSql, [item_pick_quantity, item_id], (err) => {
                if (err) {
                    console.error('Error updating available items:', err);
                    return res.status(500).send('Error updating available items');
                }
                res.send('Item picked from warehouse successfully'); // Success message returned to client
            });
        });
    });
});


// Endpoint to handle barcode-based addition
app.post('/addItemByBarcode', (req, res) => {
    const { item_name, item_quantity, barcode_value, bin_id } = req.body;

    if (!item_name || !item_quantity || !barcode_value || !bin_id) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    // Helper function to find an available bin
    const findAvailableBin = (barcodeValue, callback) => {
        // check in item_bin_assignment_barcode table to see if there are any existing binids
        const checkExistingSql = 'SELECT bin_id FROM item_bin_assignment_barcode WHERE item_id = ?';
        db.query(checkExistingSql, [barcodeValue], (err, existingBins) => {
            if (err) {
                return callback(err, null);
            }

            if (existingBins.length > 0) {
                // Item already has a bin assigned
                return callback(null, existingBins[0].bin_id); // Return existing bin_id
            } else {
                // Find an unused bin
                const findUnusedSql = 'SELECT bin_id FROM bins WHERE status = "Unused" LIMIT 1';
                db.query(findUnusedSql, (err, unusedBins) => {
                    if (err) {
                        return callback(err, null);
                    }

                    if (unusedBins.length > 0) {
                        callback(null, unusedBins[0].bin_id); // Return unused bin_id
                    } else {
                        callback(new Error('No available bins'), null); // No bins available
                    }
                });
            }
        });
    };

    findAvailableBin(barcode_value, (err, binId) => {
        if (err) {
            console.error('Error finding available bin:', err);
            return res.status(500).json({ message: 'Error finding available bin' });
        }

        if (!binId) {
            return res.status(500).json({ message: 'No available bins for this item' });
        }

        const sqlInsertTransaction = `
            INSERT INTO add_item_to_warehouse_by_barcode_scanning (item_name, item_quantity, barcode_value, bin_id)
            VALUES (?, ?, ?, ?)
        `;

        db.query(sqlInsertTransaction, [item_name, item_quantity, barcode_value, binId], (err) => {
            if (err) {
                console.error('Error adding item by barcode:', err);
                return res.status(500).json({ message: 'Error adding item by barcode' });
            }

            // Update available_items_barcode table
            const availableUpdateSql = `
                INSERT INTO available_items_barcode (item_id, item_name, added_quantity, picked_quantity, bin_id)
                VALUES (?, ?, ?, 0, ?)
                ON DUPLICATE KEY UPDATE added_quantity = added_quantity + VALUES(added_quantity)
            `;

            db.query(availableUpdateSql, [barcode_value, item_name, item_quantity, binId], (err) => {
                if (err) {
                    console.error('Error updating available items by barcode:', err);
                    return res.status(500).send('Error updating available items by barcode');
                }

                // Mark bin as used
                const updateBinSql = 'UPDATE bins SET status = "Used" WHERE bin_id = ?';
                db.query(updateBinSql, [bin_id], (err) => {
                    if (err) {
                        console.error('Error marking bin as used:', err);
                        return res.status(500).send('Error marking bin as used');
                    }
                    // Assign the bin to item in item_bin_assignment_barcode table
                    const assignBinSql = `
                        INSERT INTO item_bin_assignment_barcode (item_id, bin_id)
                        VALUES (?, ?)`;
                    db.query(assignBinSql, [barcode_value, bin_id], (err) => {
                        if (err) {
                            console.error('Error Assigning the bin to the item:', err);
                            return res.status(500).send('Error Assigning the bin to the item');
                        }
                            console.log(`Item added to warehouse by barcode successfully with bin ${binId}`);
                            
                        
                        res.json({ message: 'Item added to warehouse by barcode successfully' });
                    });

                });
            });
        });
    });
});


// Endpoint to handle barcode-based pickUp

// Endpoint to fetch all available barcodes
app.get('/barcodes', (req, res) => {
    const sqlGetBarcodes = 'SELECT DISTINCT barcode_value FROM add_item_to_warehouse_by_barcode_scanning';

    db.query(sqlGetBarcodes, (err, results) => {
        if (err) {
            console.error('Error fetching barcodes:', err);
            return res.status(500).json({ message: 'Error fetching barcodes' });
        }

        res.json(results); // Send back the list of barcodes
    });
});

// Endpoint to fetch item details based on barcode
app.get('/items', (req, res) => {
    const barcode = req.query.barcode;

    if (!barcode) {
        return res.status(400).json({ message: 'Barcode is required' });
    }

    const sqlGetItem = 'SELECT item_name, item_quantity FROM add_item_to_warehouse_by_barcode_scanning WHERE barcode_value = ?';

    db.query(sqlGetItem, [barcode], (err, results) => {
        if (err) {
            console.error('Error fetching item:', err);
            return res.status(500).json({ message: 'Error fetching item' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Item not found with this barcode' });
        }

        res.json(results[0]); // Send back the first matching item's details
    });
});

// Endpoint to fetch all available barcodes
// app.get('/barcodes', (req, res) => {
//     const sqlGetBarcodes = 'SELECT DISTINCT barcode_value FROM add_item_to_warehouse_by_barcode_scanning';

//     db.query(sqlGetBarcodes, (err, results) => {
//         if (err) {
//             console.error('Error fetching barcodes:', err);
//             return res.status(500).json({ message: 'Error fetching barcodes' });
//         }

//         res.json(results); // Send back the list of barcodes
//     });
// });

// Endpoint to fetch all available barcodes
app.get('/barcodes', (req, res) => {
    const sqlGetBarcodes = 'SELECT DISTINCT barcode_value FROM add_item_to_warehouse_by_barcode_scanning';

    db.query(sqlGetBarcodes, (err, results) => {
        if (err) {
            console.error('Error fetching barcodes:', err);
            return res.status(500).json({ message: 'Error fetching barcodes' });
        }

        res.json(results); // Send back the list of barcodes
    });
});

// Endpoint to fetch item details based on barcode
app.get('/items', (req, res) => {
    const barcode = req.query.barcode;

    if (!barcode) {
        return res.status(400).json({ message: 'Barcode is required' });
    }

    const sqlGetItem = 'SELECT item_name, item_quantity FROM add_item_to_warehouse_by_barcode_scanning WHERE barcode_value = ?';

    db.query(sqlGetItem, [barcode], (err, results) => {
        if (err) {
            console.error('Error fetching item:', err);
            return res.status(500).json({ message: 'Error fetching item' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Item not found with this barcode' });
        }

        res.json(results[0]); // Send back the first matching item's details
    });
});

// Endpoint to handle picking items by barcode
// Endpoint to fetch all available barcodes
app.get('/barcodes', (req, res) => {
    const sqlGetBarcodes = 'SELECT DISTINCT barcode_value FROM add_item_to_warehouse_by_barcode_scanning';

    db.query(sqlGetBarcodes, (err, results) => {
        if (err) {
            console.error('Error fetching barcodes:', err);
            return res.status(500).json({ message: 'Error fetching barcodes' });
        }

        res.json(results); // Send back the list of barcodes
    });
});

// Endpoint to fetch item details based on barcode
app.get('/items', (req, res) => {
    const barcode = req.query.barcode;

    if (!barcode) {
        return res.status(400).json({ message: 'Barcode is required' });
    }

    const sqlGetItem = 'SELECT item_name, item_quantity FROM add_item_to_warehouse_by_barcode_scanning WHERE barcode_value = ?';

    db.query(sqlGetItem, [barcode], (err, results) => {
        if (err) {
            console.error('Error fetching item:', err);
            return res.status(500).json({ message: 'Error fetching item' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Item not found with this barcode' });
        }

        res.json(results[0]); // Send back the first matching item's details
    });
});

// Endpoint to handle picking items by barcode
app.post('/pickUpItemByBarcode', (req, res) => {
    const item_name = 'item_name';
    const { barcode_value, item_quantity } = req.body;

    if (!barcode_value || !item_name || !item_quantity) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const sqlGetItem = 'SELECT item_quantity FROM add_item_to_warehouse_by_barcode_scanning WHERE barcode_value = ?';

    db.query(sqlGetItem, [barcode_value], (err, results) => {
        if (err) {
            console.error('Error fetching item:', err);
            return res.status(500).json({ message: 'Error fetching item' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Item not found with this barcode' });
        }

        const currentQuantity = results[0].item_quantity;

        if (item_quantity > currentQuantity) {
            return res.status(400).json({ message: 'Not enough stock available' });
        }

        // Update quantity in add_item_to_warehouse_by_barcode_scanning table
        const updatedQuantity = currentQuantity - item_quantity;

        const sqlUpdateItem = 'UPDATE add_item_to_warehouse_by_barcode_scanning SET item_quantity = ? WHERE barcode_value = ?';

        db.query(sqlUpdateItem, [updatedQuantity, barcode_value], (err) => {
            if (err) {
                console.error('Error updating item quantity:', err);
                return res.status(500).json({ message: 'Error updating item quantity' });
            }

            // Insert new entry into pick_up_item_by_barcode_scanning table
            const sqlInsertTransaction = `
                  INSERT INTO pick_up_item_by_barcode_scanning (item_name, item_quantity, barcode_value)
                  VALUES (?, ?, ?)
              `;

            db.query(sqlInsertTransaction, [item_name, item_quantity, barcode_value], (err) => {
                if (err) {
                    console.error('Error adding pick-up transaction:', err);
                    return res.status(500).json({ message: 'Error adding pick-up transaction' });
                }

                // Step 5: Update available_items_barcode table
                const availableUpdateSql = `
                    UPDATE available_items_barcode 
                    SET picked_quantity = picked_quantity + ?
                    WHERE item_id = ?
                `;
                db.query(availableUpdateSql, [item_quantity, barcode_value], (err) => {
                    if (err) {
                        console.error('Error updating available items by barcode:', err);
                        return res.status(500).send('Error updating available items by barcode');
                    }
                    res.json({
                        message: 'Item picked successfully',
                        picked_quantity: item_quantity,
                    });
                });
            });
        });
    });
});

// Endpoint to handle order placement
app.post('/api/orders', (req, res) => {
    const { orderId, price, itemName } = req.body;

    console.log('Received order:', { orderId, price, itemName }); // Log the received data

    // SQL query to insert new order
    const query = `
        INSERT INTO orders (order_id, price, item_name, order_date, order_time)
        VALUES (?, ?, ?, CURDATE(), CURTIME())
    `;

    db.execute(query, [orderId, price, itemName], (err, results) => {
        if (err) {
            console.error('Error inserting order:', err);
            return res.status(500).json({ error: 'Failed to place order', details: err.message }); // Include error details
        }
        console.log('Order inserted successfully.  Order ID:', orderId);
        res.status(201).json({ message: 'Order placed successfully', orderId });
    });
});


// Endpoint to fetch available items
app.get('/availableItems', (req, res) => {
    const query = 'SELECT * FROM available_items';
    db.query(query, (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

app.get('/availableItemsBarcode', (req, res) => {
    const query = 'SELECT * FROM available_items_barcode';
    db.query(query, (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});
// Default route for undefined routes
app.use((req, res) => {
    res.status(404).send('Page not found');
});

// Start the server
const PORT = 5505;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}/index.html`);
});