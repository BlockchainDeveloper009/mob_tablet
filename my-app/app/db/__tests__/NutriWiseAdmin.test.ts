import { getAllNutrientValues } from '../NutriWiseAdmin';
import { getDbConnectionForNutriWise } from '../database';

// Mock the `getAllAsync` method
// jest.mock('../src/database/connection', () => ({
//   db: {
//     getAllAsync: jest.fn()
//   }
// }));



test('getAllNutrientValues', () => {
  var result = getAllNutrientValues();
  console.log(result);
  //expect(getAllNutrientValues()).toBe(instanceof(Promise));
});

// describe('getAllNutrientValues', () => {
//   it('returns rows when db.getAllAsync resolves', async () => {
//     const mockData = [
//       { id: 1, name: 'Vitamin C', value: 60 },
//       { id: 2, name: 'Iron', value: 10 }
//     ];

//     (getAllNutrientValues as jest.Mock).mockResolvedValue(mockData);

//     const result = await getAllNutrientValues();
//     expect(result).toEqual(mockData);
//     expect(getAllNutrientValues).toHaveBeenCalledWith('SELECT * FROM NUTRI_REF_Food;');
//   });

//   it('throws error when db.getAllAsync rejects', async () => {
//     const error = new Error('DB query failed');
//     (getAllNutrientValues as jest.Mock).mockRejectedValue(error);

//     await expect(getAllNutrientValues()).rejects.toThrow('DB query failed');
//     expect(getAllNutrientValues).toHaveBeenCalledWith('SELECT * FROM NUTRI_REF_Food;');
//   });
// });
