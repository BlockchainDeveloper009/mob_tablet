import { View, Text, Image, TextInput } from 'react-native';

interface Props {
    placeholder: string;
    onPress?: ()=> void;
}
const SearchBar = ( { placeholder, onPress}: Props) => {
    return (
        <View className = "flex-row items-center bg-drak-200 rounded-full px-5 py-4">
            <TextInput  
                onPress={() => {}}
                placeholder="Search_Bar Page"
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
        </View>
    )
}

export default SearchBar;
