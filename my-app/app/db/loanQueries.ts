import { getDbConnectionForLoans } from './database';
import { Loan } from '../../interfaces/Loan';

const db = getDbConnectionForLoans();

// export const getAllLoans = (): Promise<Loan[]> => {
//   return new Promise((resolve, reject) => {
//     db.transaction(tx => {
//       tx.executeSql(
//         'CREATE TABLE IF NOT EXISTS loans (id INTEGER PRIMARY KEY AUTOINCREMENT, borrower TEXT, amount REAL);'
//       );
//       tx.executeSql(
//         'SELECT * FROM loans;',
//         [],
//         (_, result:any) => {
//           const rows = result.rows._array as Loan[];
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
