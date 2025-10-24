import { View, Text, Image, TextInput } from 'react-native';
import RemindersScreen from '../components/todo';
interface Props {
    placeholder: string;
    onPress?: ()=> void;
}
const todo = ( { placeholder, onPress}: Props) => {
    return (
        <View className = "flex-row items-center bg-drak-200 rounded-full px-5 py-4">
            <TextInput  
                onPress={() => {}}
                placeholder="Search"
                value=""
                onChangeText={() => {}}
                placeholderTextColor="#a8b5db"
                className="flex-1 ml-2 text-white"
            />

            <TextInput  
                onPress={() => {}}
                placeholder="Search"
                value=""
                onChangeText={() => {}}
                placeholderTextColor="#a8b5db"
                className="flex-1 ml-2 text-white"
            />
            <RemindersScreen />
        </View>
    )
}

export default todo;