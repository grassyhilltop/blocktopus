/****************************************************************************
** Meta object code from reading C++ file 'octoset.h'
**
** Created by: The Qt Meta Object Compiler version 63 (Qt 4.8.7)
**
** WARNING! All changes made in this file will be lost!
*****************************************************************************/

#include "../octoSet/octoset.h"
#if !defined(Q_MOC_OUTPUT_REVISION)
#error "The header file 'octoset.h' doesn't include <QObject>."
#elif Q_MOC_OUTPUT_REVISION != 63
#error "This file was generated using the moc from 4.8.7. It"
#error "cannot be used with the include files from this version of Qt."
#error "(The moc has changed too much.)"
#endif

QT_BEGIN_MOC_NAMESPACE
static const uint qt_meta_data_octoSet[] = {

 // content:
       6,       // revision
       0,       // classname
       0,    0, // classinfo
       4,   14, // methods
       0,    0, // properties
       0,    0, // enums/sets
       0,    0, // constructors
       0,       // flags
       0,       // signalCount

 // slots: signature, parameters, type, tag, flags
       9,    8,    8,    8, 0x08,
      29,    8,    8,    8, 0x08,
      50,    8,    8,    8, 0x08,
      70,    8,    8,    8, 0x08,

       0        // eod
};

static const char qt_meta_stringdata_octoSet[] = {
    "octoSet\0\0on_dig_in_pressed()\0"
    "on_dig_out_pressed()\0on_ana_in_pressed()\0"
    "on_ana_out_released()\0"
};

void octoSet::qt_static_metacall(QObject *_o, QMetaObject::Call _c, int _id, void **_a)
{
    if (_c == QMetaObject::InvokeMetaMethod) {
        Q_ASSERT(staticMetaObject.cast(_o));
        octoSet *_t = static_cast<octoSet *>(_o);
        switch (_id) {
        case 0: _t->on_dig_in_pressed(); break;
        case 1: _t->on_dig_out_pressed(); break;
        case 2: _t->on_ana_in_pressed(); break;
        case 3: _t->on_ana_out_released(); break;
        default: ;
        }
    }
    Q_UNUSED(_a);
}

const QMetaObjectExtraData octoSet::staticMetaObjectExtraData = {
    0,  qt_static_metacall 
};

const QMetaObject octoSet::staticMetaObject = {
    { &QMainWindow::staticMetaObject, qt_meta_stringdata_octoSet,
      qt_meta_data_octoSet, &staticMetaObjectExtraData }
};

#ifdef Q_NO_DATA_RELOCATION
const QMetaObject &octoSet::getStaticMetaObject() { return staticMetaObject; }
#endif //Q_NO_DATA_RELOCATION

const QMetaObject *octoSet::metaObject() const
{
    return QObject::d_ptr->metaObject ? QObject::d_ptr->metaObject : &staticMetaObject;
}

void *octoSet::qt_metacast(const char *_clname)
{
    if (!_clname) return 0;
    if (!strcmp(_clname, qt_meta_stringdata_octoSet))
        return static_cast<void*>(const_cast< octoSet*>(this));
    return QMainWindow::qt_metacast(_clname);
}

int octoSet::qt_metacall(QMetaObject::Call _c, int _id, void **_a)
{
    _id = QMainWindow::qt_metacall(_c, _id, _a);
    if (_id < 0)
        return _id;
    if (_c == QMetaObject::InvokeMetaMethod) {
        if (_id < 4)
            qt_static_metacall(this, _c, _id, _a);
        _id -= 4;
    }
    return _id;
}
QT_END_MOC_NAMESPACE
