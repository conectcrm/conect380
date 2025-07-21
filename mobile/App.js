"use strict";
exports.__esModule = true;
var expo_status_bar_1 = require("expo-status-bar");
var react_1 = require("react");
var react_native_1 = require("react-native");
function App() {
    return (<react_native_1.View style={styles.container}>
      <react_native_1.Text style={styles.title}>🔥 Fênix CRM</react_native_1.Text>
      <react_native_1.Text style={styles.subtitle}>Mobile App</react_native_1.Text>
      <react_native_1.Text style={styles.description}>
        O aplicativo mobile será desenvolvido aqui com React Native e Expo
      </react_native_1.Text>
      <expo_status_bar_1.StatusBar style="auto"/>
    </react_native_1.View>);
}
exports["default"] = App;
var styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#3b82f6',
        marginBottom: 10
    },
    subtitle: {
        fontSize: 18,
        color: '#64748b',
        marginBottom: 20
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        color: '#64748b',
        lineHeight: 24
    }
});
