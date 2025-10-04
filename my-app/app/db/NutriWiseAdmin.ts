import { getDbConnectionForNutriWise } from './database';
import { AdminNewFoodPayload, NutrientValues } from '../../interfaces/admin_interfaces';
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('NutriWise.db')//getDbConnectionForNutriWise();

export async function getAllNutrientValues(): Promise<NutrientValues[]> {
  try {
    // This executes the SELECT and returns an array of rows directly
    const rows = await db.getAllAsync<NutrientValues>('SELECT * FROM NUTRI_REF_Food;');
    console.log('-----')
    console.log(rows)
    console.log('-----')
    return rows;
  } catch (error) {
    console.error('Error in getAllNutrientValues:', error);
    throw error;
  }
}

// export const getAllNutrientValues = (): Promise<NutrientValues[]> => {
//   return new Promise((resolve, reject) => {
//     db.tra.transaction(tx => {
//       tx.executeSql(
//         'CREATE TABLE IF NOT EXISTS loans (id INTEGER PRIMARY KEY AUTOINCREMENT, borrower TEXT, amount REAL);'
//       );
//       tx.executeSql(
//         'SELECT * FROM NUTRI_REF_Food;',
//         [],
//         (_, result:any) => {
//           const rows = result.rows._array as NutrientValues[];
//           resolve(rows);
//         },
//         (_, error:any) => {
//           reject(error);
//           return false;
//         }
//       );
//     });
//   });
// };

// export const addLoan = (loan: Omit<Loan, 'id'>): Promise<void> => {
//   return new Promise((resolve, reject) => {
//     db.transaction(tx => {
//       tx.executeSql(
//         'INSERT INTO loans (borrower, amount) VALUES (?, ?);',
//         [loan.borrower, loan.amount],
//         () => resolve(),
//         (_, error:any) => {
//           reject(error);
//           return false;
//         }
//       );
//     });
//   });
// };





