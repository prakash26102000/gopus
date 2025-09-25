# Excel Import Format for Products

## Required Columns

| Column Name | Required | Data Type | Description | Example |
|-------------|----------|-----------|-------------|---------|
| productname | YES | Text | Product name | "Cotton T-Shirt" |
| brand | YES | Text | Brand name | "Fashion Brand" |
| price | YES | Number | Base price | 999.99 |
| category | YES | Number | Main category ID | 1 |
| subcategory | YES | Number | Subcategory ID | 1 |

## Optional Columns

| Column Name | Required | Data Type | Description | Example |
|-------------|----------|-----------|-------------|---------|
| mrp | NO | Number | Maximum Retail Price | 1299.99 |
| rating | NO | Number | Product rating (0-5) | 4.5 |
| description | NO | Text | Product description | "Premium cotton t-shirt" |
| gst | NO | Number | GST percentage | 18.00 |
| gst_type | NO | Text | "inclusive" or "exclusive" | "exclusive" |
| size | NO | Text | Comma-separated sizes (legacy) | "S,M,L,XL" |
| specifications | NO | JSON | Product specifications | See below |
| sizes | NO | JSON Array | Size details with pricing | See below |

## Specifications Format (JSON)

```json
{
  "Material": "100% Cotton",
  "Color": "Blue",
  "Fit": "Regular",
  "Care": "Machine Wash"
}
```

## Sizes Format (JSON Array)

### Basic Size (No Price Modification)
```json
[
  {
    "size_type": "clothing",
    "size_value": "M",
    "is_available": true,
    "price_modifier_type": "none"
  }
]
```

### Size with Percentage Price Modification
```json
[
  {
    "size_type": "clothing",
    "size_value": "L",
    "is_available": true,
    "price_modifier_type": "percentage",
    "price_modifier_value": 110
  }
]
```
*This means L size costs 110% of the base price*

### Size with Fixed Price
```json
[
  {
    "size_type": "clothing",
    "size_value": "XL",
    "is_available": true,
    "price_modifier_type": "fixed",
    "price": 1199.99,
    "mrp": 1499.99
  }
]
```

### Multiple Sizes Example
```json
[
  {
    "size_type": "clothing",
    "size_value": "S",
    "is_available": true,
    "price_modifier_type": "none"
  },
  {
    "size_type": "clothing",
    "size_value": "M",
    "is_available": true,
    "price_modifier_type": "none"
  },
  {
    "size_type": "clothing",
    "size_value": "L",
    "is_available": true,
    "price_modifier_type": "percentage",
    "price_modifier_value": 110
  },
  {
    "size_type": "clothing",
    "size_value": "XL",
    "is_available": false,
    "price_modifier_type": "fixed",
    "price": 1199.99,
    "mrp": 1499.99
  }
]
```

## Size Types

| Size Type | Description | Examples |
|-----------|-------------|----------|
| clothing | For clothing items | S, M, L, XL, XXL |
| shoes | For footwear | 6, 7, 8, 9, 10, 11, 12 |
| weight | For weight-based products | 1kg, 2kg, 5kg, 500g |
| custom | For custom sizing | Any custom value |

## Price Modifier Types

| Type | Description | Required Fields | Example |
|------|-------------|----------------|---------|
| none | Use base product price | None | `"price_modifier_type": "none"` |
| percentage | Percentage of base price | price_modifier_value | `"price_modifier_type": "percentage", "price_modifier_value": 110` |
| fixed | Set specific price | price, mrp (optional) | `"price_modifier_type": "fixed", "price": 1199.99, "mrp": 1499.99` |

## Complete Excel Row Examples

### Example 1: Basic Clothing Item
```
productname: Cotton T-Shirt
brand: Fashion Brand
price: 999.99
mrp: 1299.99
rating: 4.5
description: Premium cotton t-shirt with comfortable fit
gst: 18.00
gst_type: exclusive
size: S,M,L,XL
category: 1
subcategory: 1
specifications: {"Material": "100% Cotton", "Color": "Blue", "Fit": "Regular"}
sizes: [{"size_type": "clothing", "size_value": "S", "is_available": true, "price_modifier_type": "none"}, {"size_type": "clothing", "size_value": "M", "is_available": true, "price_modifier_type": "none"}, {"size_type": "clothing", "size_value": "L", "is_available": true, "price_modifier_type": "percentage", "price_modifier_value": 110}, {"size_type": "clothing", "size_value": "XL", "is_available": true, "price_modifier_type": "fixed", "price": 1199.99, "mrp": 1499.99}]
```

### Example 2: Shoes
```
productname: Running Shoes
brand: Sports Brand
price: 2499.99
mrp: 3499.99
rating: 4.2
description: Lightweight running shoes with excellent cushioning
gst: 12.00
gst_type: inclusive
size: 6,7,8,9,10
category: 2
subcategory: 4
specifications: {"Material": "Mesh Upper", "Sole": "Rubber", "Type": "Running"}
sizes: [{"size_type": "shoes", "size_value": "6", "is_available": true, "price_modifier_type": "none"}, {"size_type": "shoes", "size_value": "7", "is_available": true, "price_modifier_type": "none"}, {"size_type": "shoes", "size_value": "8", "is_available": true, "price_modifier_type": "none"}, {"size_type": "shoes", "size_value": "9", "is_available": false, "price_modifier_type": "none"}, {"size_type": "shoes", "size_value": "10", "is_available": true, "price_modifier_type": "percentage", "price_modifier_value": 105}]
```

### Example 3: Weight-based Product
```
productname: Protein Powder
brand: Nutrition Brand
price: 1899.99
mrp: 2299.99
rating: 4.7
description: Whey protein powder for muscle building
gst: 5.00
gst_type: exclusive
size: 1kg,2kg,5kg
category: 3
subcategory: 7
specifications: {"Protein": "25g per serving", "Flavor": "Chocolate", "Type": "Whey Isolate"}
sizes: [{"size_type": "weight", "size_value": "1kg", "is_available": true, "price_modifier_type": "none"}, {"size_type": "weight", "size_value": "2kg", "is_available": true, "price_modifier_type": "fixed", "price": 3599.99, "mrp": 4299.99"}, {"size_type": "weight", "size_value": "5kg", "is_available": true, "price_modifier_type": "fixed", "price": 8499.99, "mrp": 9999.99"}]
```

## Important Notes

1. **Category and Subcategory IDs**: These must be valid IDs that exist in your database. You can find these by checking your admin panel or database.

2. **JSON Format**: The specifications and sizes columns must contain valid JSON. Use double quotes for strings and ensure proper formatting.

3. **Price Modifier Logic**:
   - `none`: Uses the base product price
   - `percentage`: Multiplies base price by (price_modifier_value / 100)
   - `fixed`: Uses the specific price and MRP provided

4. **Size Availability**: Set `is_available` to `false` for out-of-stock sizes.

5. **GST Types**:
   - `exclusive`: GST is added to the price
   - `inclusive`: GST is included in the price

6. **File Format**: Save your Excel file as .xlsx or .xls format.

## Getting Category and Subcategory IDs

To find the correct category and subcategory IDs:

1. Go to your admin panel
2. Check the categories section
3. Note down the ID numbers for the categories you want to use
4. Use these exact numbers in your Excel file

## Error Handling

The import process will:
- Skip rows with missing required fields
- Show detailed error messages for failed imports
- Continue processing even if some rows fail
- Provide a summary of successful and failed imports

## Download Template

Use the "Download Template" button in the admin panel to get a properly formatted Excel file with examples.